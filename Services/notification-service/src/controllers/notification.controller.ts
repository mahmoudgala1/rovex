import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";
import { NotificationFilter } from "../types/notification.types";

const service = new NotificationService();

export class NotificationController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id as string;

      const filter: NotificationFilter = {
        userId,
        status: req.query.status as NotificationFilter["status"],
        // type: req.query.type as string | undefined,
        // channel: req.query.channel as NotificationFilter["channel"],
        from: req.query.from ? new Date(req.query.from as string) : undefined,
        to: req.query.to ? new Date(req.query.to as string) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const result = await service.fetch(filter);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req as any).user!.id as string;
      const result = await service.getUnreadCount(userId);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req as any).user!.id as string;
      const id = req.params.id as string;

      const result = await service.read(id, userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async markAsUnread(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req as any).user!.id as string;
      const id = req.params.id as string;

      const result = await service.markUnread(id, userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req as any).user!.id as string;
      const result = await service.readAll(userId);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async deleteOne(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req as any).user!.id as string;
      const id = req.params.id as string;

      const result = await service.delete(id, userId);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async deleteAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req as any).user!.id as string;
      const type = req.query.type as string | undefined;

      const result = await service.deleteAll(userId, type);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
