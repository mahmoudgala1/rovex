import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for individual items in the Wishlist
export interface IWishlistItem {
  product: Types.ObjectId;
  addedAt: Date;
}

// Interface for the Wishlist Document
export interface IWishlist extends Document {
  user: Types.ObjectId;
  items: IWishlistItem[];
}
//
export interface AddToWishlistInput {
    productId: mongoose.Types.ObjectId;
}

export interface RemoveItemParams {
    productId: mongoose.Types.ObjectId;
}