import mongoose, { Schema, Document, Types } from 'mongoose';
import { IWishlist, IWishlistItem } from '../types/whishlist.types';


const WishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true }, // Index for fast lookups
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const WishlistModel = mongoose.model<IWishlist>('Wishlist', WishlistSchema);