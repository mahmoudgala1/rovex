import { Request, Response, NextFunction } from "express";
import * as svc from "../services/orderIssue.service";

export const reportIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;
    const { rating, issueType, comment, images, roverId } = req.body;
    const { id: userId, company: companyId } = (req as any).user!;
    const userName = "Mahmoud galal";
    const result = await svc.createOrderIssue(
      userId,
      companyId,
      userName,
      orderId,
      rating,
      issueType,
      comment,
      images,
      roverId,
    );
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

export const getOrderIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;
    const companyId = (req as any).user!.company;
    const result = await svc.getOrderIssueByOrderId(
      orderId,
      companyId,
      (req as any).user!.id,
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
};
