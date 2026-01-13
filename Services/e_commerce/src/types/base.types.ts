import mongoose from "mongoose";
export interface BaseDocument extends Omit<mongoose.Document, '_id'> {
    _id: string; 
}