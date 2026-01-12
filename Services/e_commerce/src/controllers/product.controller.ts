import { Request, Response, NextFunction, RequestHandler } from "express";
import { API_Response } from "../types/response.types";
import {
  CreateProductInput,
  GetPtoductParams,
  UpdateProductInput,
} from "../types/products.types";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  CreateProductService,
  getAllProductsService,
  updateProductService,
} from "../services/product.services";
import { IQueryString } from "../types";

//create new product
export const createProduct = asyncHandler(
  async (
    req: Request<unknown, API_Response, CreateProductInput, unknown>,
    res,
    next
  ) => {
    console.log("user", req.user);
    const NewProduct = await CreateProductService(req.body);

    res.status(200).json({
      success: true,
      message: "New product is created",
      data: NewProduct,
    });
  }
);

//get all products
export const getAllProducts = asyncHandler(
  async (
    req: Request<unknown, API_Response, unknown, IQueryString>,
    res,
    next
  ) => {
    const allProducts = await getAllProductsService(req.query);

    res.status(200).json({
      success: true,
      message: "all products retrieved successfult",
      data: allProducts,
    });
  }
);

//get product by id
export const getProductById = asyncHandler(
  async (
    req: Request<GetPtoductParams, API_Response, unknown, unknown>,
    res,
    next
  ) => {
    const product = (req as any).product;

    res.status(200).json({
      success: true,
      message: "product retrieved successfult",
      data: product,
    });
  }
);

//update product property

export const updateProduct = asyncHandler(
  async (
    req: Request<GetPtoductParams, API_Response, UpdateProductInput, unknown>,
    res,
    next
  ) => {
    const updatedProduct = await updateProductService(req.params.id, req.body);
    const isDeleted = !(updatedProduct as NonNullable<typeof updatedProduct>)
      .is_active;
    const message = isDeleted
      ? "Product deleted successfully"
      : "Product updated successfully";
    const data = isDeleted ? "" : updatedProduct;
    res.status(200).json({
      success: true,
      message: message,
      data: data,
    });
  }
);
