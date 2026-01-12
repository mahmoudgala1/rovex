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
        company:{
            type:Schema.Types.ObjectId,
            required:[true,"Product must belong to a company"],
            index:true,
        },
        created_at:{
            type:Date
        }
    }
)

// Rule company cannot have two products with the same Title
productSchema.index({ company: 1, title: 1 }, { unique: true });

export const productModel= mongoose.model<IProduct>('Product',productSchema);