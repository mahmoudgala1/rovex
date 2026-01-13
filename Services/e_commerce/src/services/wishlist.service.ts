import mongoose from 'mongoose';
import { WishlistModel } from '../models/whishlist.model';
import { AppError } from '../utils/AppError'; 


export const addToWishlistService = async (userId:String, productId:String) => {
  
    const wishlist = await WishlistModel.findOneAndUpdate(
        { user: userId },
        { 
            $addToSet: { items: { product: productId } } // $addToSet prevents duplicates
        },
        { new: true, upsert: true } // upsert: create if not found
    ).populate('items.product');

    return wishlist;
};


export const removeFromWishlistService = async (userId: String, productId: String) => {
    const wishlist = await WishlistModel.findOneAndUpdate(
        { user: userId ,
            "items.product": productId
        },
        { 
            $pull: { items: { product: productId } } // efficient removal
        },
        { new: true }
    );

    if (!wishlist) throw new AppError('Product not found in your wishlist', 404);
    
    return wishlist;
};

/**
 * Gets the list.
 */
export const getWishlistService = async (userId: String, idsOnly: boolean = false) => {
   
   if (idsOnly) {
    const wishlist = await WishlistModel.findOne({ user: userId })
        .populate({
            path: 'items.product',
            match: { is_active: true }, // If false, 'item.product' becomes null
            select: '_id'
        })
        .lean();

    if (!wishlist) return []; 

    
    const activeItemIDs = wishlist.items
        .filter(item => item.product != null) 
        .map(item => (item.product as any)._id);

    return activeItemIDs;
}

   // Full Details (Wishlist Page)
   const wishlist = await WishlistModel.findOne({ user: userId })
        .populate({
            path: 'items.product',
            match: { is_active: true }, // 1. Only populate if active
            select: 'title price images_URL description discount stock' // 2. Select specific fields
        })
        .lean();

    // Return empty structure    if not found (Better UX)
    if (!wishlist) {
        return { user: userId, items: [] };
    }
   
  const activeItems = wishlist.items.filter(item => item.product != null);
    return activeItems;
};

export const clearWishlistService = async (userId: String) => {
    const wishlist = await WishlistModel.findOneAndUpdate(
        { user: userId },
        { $set: { items: [] } },
        { new: true }
    );  
    if (!wishlist) throw new AppError('Wishlist not found', 404);
    
    return wishlist;
};
