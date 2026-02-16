import { Response } from "express";
import { PriceService } from "../services/price.service";
import { AuthenticatedRequest } from "../types/stripe.types";
import { successResponse, errorResponse } from "../utils/response";
import { Logger } from "../utils/logger";

export class PriceController {
  private priceService: PriceService;
  private logger: Logger;

  constructor() {
    this.priceService = new PriceService();
    this.logger = new Logger("PriceController");
  }

  createPrice = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const {
        productId,
        currency,
        unitAmount,
        recurring,
        active,
        nickname,
        metadata,
      } = req.body;

      if (!productId || !currency || unitAmount === undefined) {
        errorResponse(
          res,
          "Product ID, currency, and unit amount are required",
          400,
        );
        return;
      }

      const price = await this.priceService.createPrice({
        productId,
        currency,
        unitAmount,
        recurring,
        active,
        nickname,
        metadata,
      });

      this.logger.info(`Price created: ${price.id}`);
      successResponse(res, price, "Price created successfully", 201);
    } catch (error) {
      this.logger.error("Error creating price:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  getPrice = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const priceId = String(req.params.priceId);

      const price = await this.priceService.getPrice(priceId);
      successResponse(res, price);
    } catch (error) {
      this.logger.error("Error fetching price:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  updatePrice = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const priceId = String(req.params.priceId);
      const updates = req.body;

      const price = await this.priceService.updatePrice(priceId, updates);

      this.logger.info(`Price updated: ${priceId}`);
      successResponse(res, price, "Price updated successfully");
    } catch (error) {
      this.logger.error("Error updating price:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  listPrices = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { productId, active, limit } = req.query;

      const activeFilter =
        active === "true" ? true : active === "false" ? false : undefined;

      const prices = await this.priceService.listPrices(
        productId as string,
        activeFilter,
        limit ? parseInt(limit as string) : 10,
      );

      successResponse(res, prices);
    } catch (error) {
      this.logger.error("Error listing prices:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  searchPrices = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { query } = req.query;

      if (!query) {
        errorResponse(res, "Search query is required", 400);
        return;
      }

      const prices = await this.priceService.searchPrices(query as string);
      successResponse(res, prices);
    } catch (error) {
      this.logger.error("Error searching prices:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };
}
