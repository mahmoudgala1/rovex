import axios from 'axios'; // To talk to Payment Microservice
import { AppError } from '../utils/AppError';
import { OrderModel } from '../models/order.model';
import { productModel } from '../models/product.models';
import CartModel from '../models/cart.model';
import { validateCoupon } from '../helper/validate_coupon.helper';
import coupon_model from '../models/coupon.models';
import { generateRoleBasedQuery } from '../helper/generateQuery';
import { QueryBuilder } from '../utils/queryBuilder';
import { IQueryString } from '../types';

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
  user_id: string,
  company: string,
  shipping_address: any,
  payment_method: 'Cash' | 'Card'
) => {
  // FETCH CART
  const cart = await CartModel.findOne({ user: user_id });

  if (!cart || cart.cartItems.length === 0) {
      throw new AppError('Cart is empty. Add items before placing an order.', 400);
  }

  const cart_items = cart.cartItems;

  //  FETCH PRODUCTS
  const product_ids = cart_items.map((item) => item.product);
  const db_products = await productModel.find({ _id: { $in: product_ids } });

  if (db_products.length !== cart_items.length) {
    throw new AppError('Some products in your cart are no longer available', 404);
  }

  //  VALIDATE STOCK & CALCULATE SUBTOTAL
  let subtotal_price = 0; 
  const order_items = [];
  const bulk_stock_ops = [];

  for (const item of cart_items) {
    const product = db_products.find((p) => p._id.toString() === item.product.toString());
    
    if (!product || product.stock < item.quantity) {
      throw new AppError(`Insufficient stock: ${product?.title}`, 400);
    }

    subtotal_price += product.price * item.quantity;

    order_items.push({
      product_id: product._id,
      title: product.title,
      images_URL: product.images_URL,
      price: product.price,
      quantity: item.quantity,
    });

    bulk_stock_ops.push({
      updateOne: {
        filter: { _id: product._id },
        update: { $inc: { stock: -item.quantity } },
      },
    });
  }

  
  // 4. COUPON LOGIC
  let final_price = subtotal_price;
  let discount_amount = 0;
  let coupon_used_id = undefined;

  // Check if Cart has a coupon applied
  if (cart.coupon_id) {
      try {
          //  return the coupon object if valid, or Throw Error if invalid
          const coupon = await coupon_model.findById(cart.coupon_id) 
          if (!coupon) {
             throw new Error('Coupon not found');
        }
          const validCoupon = await validateCoupon(coupon.code, company, subtotal_price);

          //  Calculate Discount
          if (validCoupon.discount_type === 'percentage') {
              discount_amount = (subtotal_price * validCoupon.discount) / 100;
          } else {
              discount_amount = validCoupon.discount; 
          }

          final_price = subtotal_price - discount_amount;
          coupon_used_id = validCoupon._id;
          console.log(validCoupon)
          // ATOMIC INCREMENT 
          const couponUpdate = await coupon_model.findOneAndUpdate(
              { _id: validCoupon._id, used_count: { $lt: validCoupon.max_usage } },
              { $inc: { used_count: 1 } }
          );

          if (!couponUpdate) {
              throw new Error('Coupon usage limit reached during checkout');
          }

      } catch (error) {
          // D. AUTO-REMOVE INVALID COUPON
          // If validation failed (expired, limit reached, etc.), we remove it from the cart
          // so the user isn't stuck in a loop.
          await CartModel.updateOne({ _id: cart._id }, { $unset: { coupon_id: 1 } });
          
          throw new AppError(
              `Coupon removed: ${(error as any).message}. Please review your total price.`, 
              400
          );
      }
  }


  // EXECUTE STOCK RESERVATION
  await productModel.bulkWrite(bulk_stock_ops);

  //  CREATE ORDER
  const expiration_date = new Date(); 
  expiration_date.setMinutes(expiration_date.getMinutes() + ORDER_EXPIRATION_MINUTES);

  const order = await OrderModel.create({
    user: user_id,
    company: company,
    items: order_items,
    shipping_address: shipping_address,
    total_price: subtotal_price,     // Original Price
    discount_amount: discount_amount,// How much user saved
    final_price: final_price,        // What  actually user pays
    coupon: coupon_used_id,          // Link to coupon
    payment_method,
    order_status: payment_method === 'Card' ? 'PendingPayment' : 'Processing', 
    expires_at: payment_method === 'Card' ? expiration_date : undefined,
  });

  // CLEAR CART
  await CartModel.findOneAndDelete({ user: user_id });

  // HANDLE PAYMENT
  let payment_data = null;  
  let payment_error = null;  
  
  if (payment_method === 'Card') {
    try {
      /*
      const response = await axios.post(PAYMENT_SERVICE_URL, {
         amount: final_price, 
         ...
      });
      */
    } catch (error) {
       console.error("Payment Gateway Down:", (error as any).message);
       payment_error = "Payment system unavailable. Please retry from My Orders.";
    }
  }

  return { order, payment_data, payment_error };
};


/**
 * CRON LOGIC: Releases stock for expired orders
 * 
 */
export const releaseExpiredStockService = async () => {
  const now = new Date();

  //  Find Expired Orders
  const expired_orders = await OrderModel.find({ 
    order_status: 'Pending_Payment',   
    expires_at: { $lte: now },       
  });

  if (expired_orders.length === 0) return;

  console.log(`Found ${expired_orders.length} expired orders. Releasing stock...`);

  const bulk_restock_ops = [];

  // Loop and Prepare Restock
  for (const order of expired_orders) {
    // Mark as Cancelled
    order.order_status = 'Cancelled';  
    order.payment_status = 'Failed';    
    await order.save();

    // Prepare Stock Increment for each item
    for (const item of order.items) {
      bulk_restock_ops.push({
        updateOne: {
          filter: { _id: item.product_id },
          update: { $inc: { stock: item.quantity } },
        },
      });
    }
  }

  //  Execute Bulk Restock
  if (bulk_restock_ops.length > 0) {
    await productModel.bulkWrite(bulk_restock_ops);
  }
  
  console.log(`Restocked ${bulk_restock_ops.length} items.`);
};


/**
 * Re-attempts payment for an existing "PendingPayment" order
 */
export const retryPaymentService = async (user_id: string, order_id: string) => { 
    const order = await OrderModel.findOne({ _id: order_id, user: user_id });

    if (!order) throw new AppError('Order not found', 404);

    // Validation
    if (order.order_status !== 'Pending_Payment') { 
        throw new AppError('This order is not waiting for payment', 400);
    }

    // Expiration Check
    if (order.expires_at && new Date() > order.expires_at) { 
        throw new AppError('Order has expired. Please place a new order.', 400);
    }

    try {
        // const response = await axios.post(PAYMENT_SERVICE_URL, {
        //     orderId: order._id,
        //     amount: order.total_price, // Changed property
        //     userId: user_id,
        //     currency: 'USD'
        // });
        // return response.data;
    } catch (error) {
        throw new AppError('Payment system still down. Please try again later.', 503);
    }
};


/**
 * Cancel Order & RESTORE Stock
 */
export const cancelOrderService = async (user_id: string, order_id: string) => { 
    //  Find Order
    const order = await OrderModel.findOne({ _id: order_id, user: user_id });

    if (!order) throw new AppError('Order not found', 404);

    // Validation
    const cancellable_statuses = ['Pending', 'Pending_Payment', 'Processing']; 
    if (!cancellable_statuses.includes(order.order_status)) { 
        throw new AppError('Cannot cancel order that has already been shipped or delivered', 400);
    }

    //  Update Status
    order.order_status = 'Cancelled';     
    order.payment_status = 'Refund_Pending'; 
    await order.save();

    // RESTORE STOCK
    const bulk_restock_ops = order.items.map(item => ({ 
        updateOne: {
            filter: { _id: item.product_id },
            update: { $inc: { stock: item.quantity } } 
        }
    }));

    if (bulk_restock_ops.length > 0) {
        await productModel.bulkWrite(bulk_restock_ops);
    }

    return order;
};

export const getOrderDetailsService = async (user_id: string, order_id: string ,company:string,role:string )=> { 
  
  const query = generateRoleBasedQuery(role, user_id,company)
   if(!query)
   {
    throw new AppError("error generation query please try again",400);
   }
    const order = await OrderModel.findOne({...query,_id:order_id});
    if (!order) throw new AppError('Order not found', 404);
    return order;
}

export const getAllOrdersService = async (user_id:string, company:string,role:string,queryString:IQueryString) => {
  const query = generateRoleBasedQuery(role, user_id,company)
  if(!query)
   {
    throw new AppError("error generation query or you do not have an accesss please try again ",400);
   }
   const features = new QueryBuilder(OrderModel.find(query), queryString)
        .filter()
        .sort()
        .limitFields()
        .paginate()
        
    return await await features.modelQuery;
       
}


