import mongoose, { Schema, Document, Types } from 'mongoose';
import { BaseDocument } from './base.types';

// Interface for individual items in the Wishlist
export interface IWishlistItem {
  product: string;
  addedAt: Date;
}

// Interface for the Wishlist Document
export interface IWishlist extends BaseDocument {
  _id: string;
  user: string;
  items: IWishlistItem[];
}
//
export interface AddToWishlistInput {
    productId: string;
}

export interface RemoveItemParams {
    productId: string;
}