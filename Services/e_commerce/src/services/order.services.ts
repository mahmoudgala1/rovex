import axios from 'axios'; // To talk to Payment Microservice
import {AppError} from '../utils/AppError';
import { OrderModel } from '../models/order.model';
import { productModel } from '../models/product.models';
import CartModel from '../models/cart.model';
import mongoose,{ Types} from 'mongoose';


// --- CONFIG ---
const ORDER_EXPIRATION_MINUTES = 20;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5001/api/payments/initiate';
/**
 * 1. Validates Stock
 * 2. Reserves Stock (Decrements)
 * 3. Creates Order (PendingPayment)
 * 4. Calls Payment Microservice
 */
export const placeOrderService = async (
  userId: mongoose.Types.ObjectId,
  items: any[],
  address: any,
  paymentMethod: 'Cash' | 'Card'
) => {
  // A. Fetch Products
  
  const productIds = items.map((i) => i.product_id);
  const dbProducts = await productModel.find({ _id: { $in: productIds } });
  
  if (dbProducts.length !== items.length) throw new AppError('Products not found', 404);

  // B. Validate Stock & Build Order Items
  let totalPrice = 0;
  const orderItems = [];
  const bulkStockOps = [];

  for (const item of items) {
    const product = dbProducts.find((p) => p._id.toString() === item.product_id);
    
    // Strict Stock Check
    if (!product || product.stock < item.quantity) {
      throw new AppError(`Insufficient stock: ${product?.title}`, 400);
    }

    totalPrice += product.price * item.quantity;

    orderItems.push({
      product_id: product._id,
      title: product.title,
      images_URL: product.images_URL,
      price: product.price,
      quantity: item.quantity,
    });

    // Reserve Stock Immediately
    bulkStockOps.push({
      updateOne: {
        filter: { _id: product._id },
        update: { $inc: { stock: -item.quantity } },
      },
    });
  }

  // C. Execute Stock Reservation
  await productModel.bulkWrite(bulkStockOps);

  // D. Create Order
  // Set expiration time (Now + 20 mins)
  const expirationDate = new Date();
  expirationDate.setMinutes(expirationDate.getMinutes() + ORDER_EXPIRATION_MINUTES);

  const order = await OrderModel.create({
    user: userId,
    items: orderItems,
    shippingAddress: address,
    totalPrice,
    paymentMethod,
    orderStatus: paymentMethod === 'Card' ? 'PendingPayment' : 'Processing', // Cash goes directly to Processing
    expiresAt: paymentMethod === 'Card' ? expirationDate : undefined,
  });

  // E. Clear Cart
  await CartModel.findOneAndDelete({ user: userId });

  // F. Handle Payment Microservice Interaction
  let paymentData = null;
   let paymentError = null;
  if (paymentMethod === 'Card') {
    try {
      // Call External Service
      const response = await axios.post(PAYMENT_SERVICE_URL, {
        orderId: order._id,
        amount: totalPrice,
        userId: userId,
        currency: 'USD'
      });
      
      paymentData = response.data; // Should contain redirect_url
    } catch (error) {
       // 2. SENIOR HANDLING: Swallow the error, don't throw it!
       console.error("Payment Gateway Down:", (error as any).message);
       
       // We leave the Order Status as 'PendingPayment'.
       // The Cron Job will clean it up in 20 mins if they don't retry.
       paymentError = "Payment system unavailable. Please retry from My Orders.";
    }
  }

  return { order, paymentData, paymentError };
};

/**
 * CRON LOGIC: Releases stock for expired orders
 * This is called by the Cron Job
 */
export const releaseExpiredStockService = async () => {
  const now = new Date();

  // 1. Find Expired Orders
  const expiredOrders = await OrderModel.find({
    orderStatus: 'PendingPayment',
    expiresAt: { $lte: now }, // Expired before now
  });

  if (expiredOrders.length === 0) return;

  console.log(`Found ${expiredOrders.length} expired orders. Releasing stock...`);

  const bulkRestockOps = [];

  // 2. Loop and Prepare Restock
  for (const order of expiredOrders) {
    // Mark as Cancelled
    order.orderStatus = 'Cancelled';
    order.paymentStatus = 'Failed';
    await order.save();

    // Prepare Stock Increment for each item
    for (const item of order.items) {
      bulkRestockOps.push({
        updateOne: {
          filter: { _id: item.product_id },
          update: { $inc: { stock: item.quantity } },
        },
      });
    }
  }

  // 3. Execute Bulk Restock
  if (bulkRestockOps.length > 0) {
    await productModel.bulkWrite(bulkRestockOps);
  }
  
  console.log(`Restocked ${bulkRestockOps.length} items.`);
};


/**
 * Re-attempts payment for an existing "PendingPayment" order
 */
export const retryPaymentService = async (user_id: mongoose.Types.ObjectId, orderId: mongoose.Types.ObjectId) => {
    const order = await OrderModel.findOne({ _id: orderId, user_id: user_id });

    if (!order) throw new AppError('Order not found', 404);

    // Validation
    if (order.orderStatus !== 'PendingPayment') {
        throw new AppError('This order is not waiting for payment', 400);
    }

    // Expiration Check
    if (order.expiresAt && new Date() > order.expiresAt) {
        throw new AppError('Order has expired. Please place a new order.', 400);
    }

    try {
        const response = await axios.post(PAYMENT_SERVICE_URL, {
            orderId: order._id,
            amount: order.totalPrice,
            userId: user_id,
            currency: 'USD'
        });
        return response.data;
    } catch (error) {
        throw new AppError('Payment system still down. Please try again later.', 503);
    }
};

/**
 * Get User's Order History (Newest first)
 */
export const getMyOrdersService = async (userId: mongoose.Types.ObjectId) => {
    return await OrderModel.find({ user: userId })
        .sort({ createdAt: -1 }) // Newest on top
        .lean(); // Performance optimization
};

/**
 * Cancel Order & RESTORE Stock
 */
export const cancelOrderService = async (userId: mongoose.Types.ObjectId, orderId:  mongoose.Types.ObjectId) => {
    // 1. Find Order
    const order = await OrderModel.findOne({ _id: orderId, user: userId });

    if (!order) throw new AppError('Order not found', 404);

    // 2. Validation: Only allow cancellation if it hasn't shipped yet
    const cancellableStatuses = ['Pending', 'PendingPayment', 'Processing'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
        throw new AppError('Cannot cancel order that has already been shipped or delivered', 400);
    }

    // 3. Update Status
    order.orderStatus = 'Cancelled';
    order.paymentStatus = 'Refund_Pending'; 
    await order.save();

    // 4. RESTORE STOCK (The most important part!)
    const bulkRestockOps = order.items.map(item => ({
        updateOne: {
            filter: { _id: item.product_id },
            update: { $inc: { stock: item.quantity } } // Increment back
        }
    }));

    if (bulkRestockOps.length > 0) {
        await productModel.bulkWrite(bulkRestockOps);
    }

    return order;
};

export const getOrderDetailsService = async (userId: mongoose.Types.ObjectId, orderId: mongoose.Types.ObjectId) => {
    const order = await OrderModel.findOne({ _id: orderId, user: userId });

    if (!order) throw new AppError('Order not found', 404);
    return order;
}

export const getAllOrdersService = async () => {
    return await OrderModel.find()
        .sort({ createdAt: -1 }) // Newest on top
        .lean(); // Performance optimization
}