import { ICart } from "../types/index";
import { ICoupon } from "../types/index";

export const calculateCartStats = (cart: ICart, coupon: ICoupon | null) => {
    // 1. Calculate Base Total
    let total = 0;
    cart.cartItems.forEach((item: any) => {
        total += item.price * item.quantity;
    });
    cart.totalCartPrice = total;

    // 2. Calculate Discount (If coupon exists)
    if (coupon) {
        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
            discountAmount = (total * coupon.discount) / 100;
        } else if (coupon.discount_type === 'fixed') {
            discountAmount = coupon.discount;
        }
        
        cart.totalPriceAfterDiscount = total - discountAmount;
        if (cart.totalPriceAfterDiscount < 0) cart.totalPriceAfterDiscount = 0;
        
        // Link the coupon
        cart.coupon_id = coupon._id;
    } else {
        // No coupon? Reset fields
        cart.totalPriceAfterDiscount = undefined;
        cart.coupon_id = null;
    }

    return cart;
};