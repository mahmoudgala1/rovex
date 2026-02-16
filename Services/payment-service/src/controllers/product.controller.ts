import { Response } from "express";
import { ProductService } from "../services/product.service";
import { AuthenticatedRequest } from "../types/stripe.types";
import { successResponse, errorResponse } from "../utils/response";
import { Logger } from "../utils/logger";

export class ProductController {
  private productService: ProductService;
  private logger: Logger;

  constructor() {
    this.productService = new ProductService();
    this.logger = new Logger("ProductController");
  }

  createProduct = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { name, description, active, metadata, images, defaultPriceData } =
        req.body;

      if (!name) {
        errorResponse(res, "Product name is required", 400);
        return;
      }

      const product = await this.productService.createProduct({
        name,
        description,
        active,
        metadata,
        images,
        defaultPriceData,
      });

      this.logger.info(`Product created: ${product.id}`);
      successResponse(res, product, "Product created successfully", 201);
    } catch (error) {
      this.logger.error("Error creating product:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  getProduct = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const productId = String(req.params.productId);

      const product = await this.productService.getProduct(productId);
      successResponse(res, product);
    } catch (error) {
      this.logger.error("Error fetching product:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  updateProduct = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const productId = String(req.params.productId);
      const updates = req.body;

      const product = await this.productService.updateProduct(
        productId,
        updates,
      );

      this.logger.info(`Product updated: ${productId}`);
      successResponse(res, product, "Product updated successfully");
    } catch (error) {
      this.logger.error("Error updating product:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  deleteProduct = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const productId = String(req.params.productId);

      const product = await this.productService.deleteProduct(productId);

      this.logger.info(`Product deleted: ${productId}`);
      successResponse(res, product, "Product deleted successfully");
    } catch (error) {
      this.logger.error("Error deleting product:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  listProducts = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { active, limit, starting_after } = req.query;

      const activeFilter =
        active === "true" ? true : active === "false" ? false : undefined;

      const products = await this.productService.listProducts(
        activeFilter,
        limit ? parseInt(limit as string) : 10,
        starting_after as string,
      );

      successResponse(res, products);
    } catch (error) {
      this.logger.error("Error listing products:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  searchProducts = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { query } = req.query;

      if (!query) {
        errorResponse(res, "Search query is required", 400);
        return;
      }

      const products = await this.productService.searchProducts(
        query as string,
      );
      successResponse(res, products);
    } catch (error) {
      this.logger.error("Error searching products:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  getProductWithPrices = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const productId = String(req.params.productId);

      const result = await this.productService.getProductWithPrices(productId);
      successResponse(res, result);
    } catch (error) {
      this.logger.error("Error fetching product with prices:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  createProductWithPrice = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const {
        name,
        description,
        currency,
        unitAmount,
        recurring,
        images,
        metadata,
      } = req.body;

      if (!name || !currency || unitAmount === undefined) {
        errorResponse(res, "Name, currency, and unit amount are required", 400);
        return;
      }

      const result = await this.productService.createProductWithPrice({
        name,
        description,
        currency,
        unitAmount,
        recurring,
        images,
        metadata,
      });

      this.logger.info(`Product with price created: ${result.product.id}`);
      successResponse(
        res,
        result,
        "Product with price created successfully",
        201,
      );
    } catch (error) {
      this.logger.error("Error creating product with price:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };
}
