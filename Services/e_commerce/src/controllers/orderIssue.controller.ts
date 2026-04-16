import { Request, Response, NextFunction } from "express";
import * as svc from "../services/orderIssue.service";
import { uploadToCloudinary } from "../utils/cloudinary";

export const reportIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;
    const { userName, userAvatarUrl, rating, issueType, comment, roverId } =
      req.body;
    const { id: userId, company: companyId } = (req as any).user!;
    const folderPath = `${companyId}/reports/${orderId}`;
    let imageURLs: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      const uploadPromises = (req.files as Express.Multer.File[]).map((file) =>
        uploadToCloudinary(file.buffer, folderPath),
      );

      imageURLs = await Promise.all(uploadPromises);
    }
    const result = await svc.createOrderIssue(
      userId,
      companyId,
      userName,
      userAvatarUrl,
      orderId,
      rating,
      issueType,
      comment,
      imageURLs,
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
