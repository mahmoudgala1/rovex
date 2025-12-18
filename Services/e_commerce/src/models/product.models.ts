import mongoose, { Schema, Document } from 'mongoose';
import { IProduct } from '../types/index';


const productSchema :Schema = new Schema(
    {

        title:{
            type:String,
            required:[true,"Product Title is required"],
        },
        price:{
            type:Number,
            required:[true,"Product Price is required"],
            min: [0, 'Price cannot be negative']
        },
        description:{
            type:String,
            required:[true,"product Description  is required"],
            
        },
        stock:{
            type:Number,
            min: [0, 'Stock cannot be negative']
        },
         discount:{
            type:Number,
            min: [0, 'Discount cannot be negative']
        },
         images_URL:{
            type:Array,
            required:[true,"Each product has one image at least"]
        },
         is_active:{
            type:Boolean,
           required:[true,"Product status is required"]
        },
        created_at:{
            type:Date
        }
    }
)

export const productModel= mongoose.model<IProduct>('Product',productSchema);