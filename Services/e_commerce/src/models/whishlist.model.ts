import mongoose, { Schema, Document, Types } from 'mongoose';
import { IWishlist, IWishlistItem } from '../types/whishlist.types';
import { nanoid } from 'nanoid';
const generateID = () => `WISH_LIST${nanoid(15)}`;
const WishlistSchema = new Schema<IWishlist>(
  {
    _id: { 
        type: String, 
        default: generateID 
    },
    user: { type:String, ref: 'User', required: true, unique: true, index: true }, // Index for fast lookups
    items: [
      {
        product: { type: String, ref: 'Product', required: true },
        _id: false, // Prevent automatic _id generation for subdocuments
  
      },
    ],
  },
  { timestamps: true }
);

export const WishlistModel = mongoose.model<IWishlist>('Wishlist', WishlistSchema);