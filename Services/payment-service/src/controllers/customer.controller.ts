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
      const { email, name, phone } = req.body;

      if (!email || !name) {
        return errorResponse(res, "Email and name are required", 400);
      }

      const customer = await this.customerService.createCustomer({
        customerId: (req as any).user.id,
        name,
        email,
        phone,
      });
      const dto = this.customerService.mapCustomerToDTO(customer);

      this.logger.info(`Customer created: ${customer.id}`);
      return successResponse(res, dto, "Customer created successfully", 201);
    } catch (error) {
      this.logger.error("Error creating customer:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  getCustomer = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = String(req.params.customerId);

      const customer = await this.customerService.getCustomer(customerId);
      const dto = this.customerService.mapCustomerToDTO(customer);

      return successResponse(res, dto);
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
      const dto = this.customerService.mapCustomerToDTO(customer);

      this.logger.info(`Customer updated: ${customerId}`);
      return successResponse(res, dto, "Customer updated successfully");
    } catch (error) {
      this.logger.error("Error updating customer:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  deleteCustomer = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = String(req.params.customerId);

      const deleted = await this.customerService.deleteCustomer(customerId);
      if (deleted.deleted) {
        this.logger.info(`Customer deleted: ${deleted.id}`);
        successResponse(
          res,
          {
            id: deleted.id,
            deleted: true,
          },
          "Customer deleted successfully",
        );
      } else {
        errorResponse(res, "Failed to delete customer", 500);
      }
    } catch (error) {
      this.logger.error("Error deleting customer:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  listCustomers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit, starting_after } = req.query;

      const customers = await this.customerService.listCustomers(
        limit ? parseInt(limit as string) : 10,
        starting_after as string,
      );
      const dto = this.customerService.mapCustomerListToDTO(customers);

      return successResponse(res, dto);
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
      const dto = this.customerService.mapSearchResultToDTO(
        customers,
        (customer) => this.customerService.mapCustomerToDTO(customer),
      );

      return successResponse(res, dto);
    } catch (error) {
      this.logger.error("Error searching customers:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };
}
