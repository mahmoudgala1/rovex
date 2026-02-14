import { Response } from "express";
import { CustomerService } from "../services/customer.service";
import { AuthenticatedRequest } from "../types/stripe.types";
import { successResponse, errorResponse } from "../utils/response";
import { Logger } from "../utils/logger";

export class CustomerController {
  private customerService: CustomerService;
  private logger: Logger;

  constructor() {
    this.customerService = new CustomerService();
    this.logger = new Logger("CustomerController");
  }

  createCustomer = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, name, phone, metadata } = req.body;

      if (!email || !name) {
        return errorResponse(res, "Email and name are required", 400);
      }

      const customer = await this.customerService.createCustomer({
        email,
        name,
        phone,
        metadata,
      });

      this.logger.info(`Customer created: ${customer.id}`);
      return successResponse(
        res,
        customer,
        "Customer created successfully",
        201,
      );
    } catch (error) {
      this.logger.error("Error creating customer:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  getCustomer = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = String(req.params.customerId);

      const customer = await this.customerService.getCustomer(customerId);
      return successResponse(res, customer);
    } catch (error) {
      this.logger.error("Error fetching customer:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  updateCustomer = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = String(req.params.customerId);
      const updates = req.body;

      const customer = await this.customerService.updateCustomer(
        customerId,
        updates,
      );

      this.logger.info(`Customer updated: ${customerId}`);
      return successResponse(res, customer, "Customer updated successfully");
    } catch (error) {
      this.logger.error("Error updating customer:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  deleteCustomer = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = String(req.params.customerId);

      const deleted = await this.customerService.deleteCustomer(customerId);
      this.logger.info(`Customer deleted: ${customerId}`);
      return successResponse(res, deleted, "Customer deleted successfully");
    } catch (error) {
      this.logger.error("Error deleting customer:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  listCustomers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit, starting_after } = req.query;

      const customers = await this.customerService.listCustomers(
        limit ? parseInt(limit as string) : 10,
        starting_after as string,
      );

      return successResponse(res, customers);
    } catch (error) {
      this.logger.error("Error listing customers:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  searchCustomers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { query } = req.query;

      if (!query) {
        return errorResponse(res, "Search query is required", 400);
      }

      const customers = await this.customerService.searchCustomers(
        query as string,
      );

      return successResponse(res, customers);
    } catch (error) {
      this.logger.error("Error searching customers:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };
}
