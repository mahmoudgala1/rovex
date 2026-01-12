import { Request, Response,NextFunction,RequestHandler } from "express";
import {API_Response} from "../types/response.types";
import { CreateProductInput, GetPtoductParams,UpdateProductInput } from "../types/products.types";
import { asyncHandler } from "../utils/asyncHandler";
import {CreateProductService,getAllProductsService,updateProductService} from "../services/product.services";
import { IQueryString, IUser } from "../types";
import { Types } from "mongoose";



//create new product
export const createProduct = asyncHandler(
    async(
       req: Request<unknown, API_Response<any>, CreateProductInput>,
       res,
        next)=>{
            const company = new Types.ObjectId((req as any).user.company)
           const NewProduct =  await CreateProductService(req.body,company);

            res.status(200).json(
                {
                    success : true,
                    message:"New product is created",
                    data:NewProduct
                }
            )
        }
    
)

//get all products
export const getAllProducts = asyncHandler(
    async(
        req: Request<unknown,API_Response,unknown,IQueryString>,
        res 
        ,next)=>{
          
           const allProducts =  await getAllProductsService(req.query,(req as any).company);

            res.status(200).json(
                {
                    success : true,
                    message:"all products retrieved successfult",
                    data:allProducts
                }
            )
        }
    
)

//get product by id
export const getProductById = asyncHandler(
    async(
        req: Request<GetPtoductParams,API_Response,unknown,unknown>,
        res 
        ,next)=>{
           const product=  (req as any).product
           
            res.status(200).json(
                {
                    success : true,
                    message:"product retrieved successfult",
                    data:product
                }
            )
        }
    
)

//update product property

export const updateProduct = asyncHandler(
    async(
        req: Request<GetPtoductParams,API_Response,UpdateProductInput,unknown>,
        res 
        ,next)=>{
        
            const company = new Types.ObjectId((req as any).user.company)
          
            const updatedProduct =  await updateProductService(req.params.id,company,req.body);
            const isDeleted = !(updatedProduct as NonNullable<typeof updatedProduct>).is_active;
            const message = isDeleted ? "Product deleted successfully" : "Product updated successfully";
            const data = isDeleted ?"":updatedProduct;
                res.status(200).json(
                {
                    success : true,
                    message:message,
                    data:data
                })
            }
           
)
