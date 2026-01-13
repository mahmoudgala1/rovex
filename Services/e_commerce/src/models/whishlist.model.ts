import mongoose, { Schema, Document, Types } from "mongoose";
import { IWishlist, IWishlistItem } from "../types/whishlist.types";
import { generateId } from "../utils/helpers";

const WishlistSchema = new Schema<IWishlist>(
  {
    _id: {
      type: String,
      default: () => generateId("WISHLIST"),
    },
    user: {
      type: String,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    }, // Index for fast lookups
    items: [
      {
        product: { type: String, ref: "Product", required: true },
        _id: false, // Prevent automatic _id generation for subdocuments
      },
    ],
  },
  { timestamps: true }
);

export const WishlistModel = mongoose.model<IWishlist>(
  "Wishlist",
  WishlistSchema
);
