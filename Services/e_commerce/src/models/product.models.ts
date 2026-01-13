import mongoose, { Schema, Document, Query } from 'mongoose';
import { IProduct } from '../types/index';

import { nanoid } from 'nanoid';
const generateID = () => `PRODUCT_${nanoid(15)}`;

const productSchema :Schema = new Schema(
    {
        _id: { 
        type: String, 
        default: generateID 
    },

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
            min: [0, 'Stock cannot be negative'],
             required:[true,"Product stock is required"],
        },
         discount:{
            type:Number,
            min: [0, 'Discount cannot be negative'],
            default:0
        },
         images_URL:{
            type:Array,
            required:[true,"Each product has one image at least"]
        },
         is_active:{
            type:Boolean,
            default:true
        },
        company:{
            type:String,
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


productSchema.pre(/^find/, function (this: Query<any, any>) {
  this.select('-company'); // 'this' is correctly typed as Query
});

export const productModel= mongoose.model<IProduct>('Product',productSchema);
