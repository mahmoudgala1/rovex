import mongoose from "mongoose";
import { OrderIssue, IssueType } from "../models/OrderIssue";
import { AppError } from "../utils/AppError";

export const createOrderIssue = async (
  userId: string,
  companyId: string,
  userName: string,
  orderId: string,
  rating: number,
  issueType: IssueType,
  comment?: string,
  images: string[] = [],
  roverId?: string,
  roverName?: string,
) => {
  if (rating >= 4) throw new AppError("Issue rating must be 1, 2, or 3", 422);
  if (images.length > 5) throw new AppError("Max 5 images allowed", 422);

  const existing = await OrderIssue.findOne({ orderId });
  if (existing)
    throw new AppError("An issue for this order already exists", 409);

  const issue = await OrderIssue.create({
    userId,
    companyId,
    userName,
    orderId,
    rating,
    issueType,
    comment,
    images,
    roverId,
    roverName,
  });

  return {
    message: "Issue reported successfully",
    issueId: issue._id,
    status: issue.status,
  };
};

export const getOrderIssueByOrderId = async (
  orderId: string,
  requestingUserId: string,
) => {
  const issue = await OrderIssue.findOne({ orderId }).lean();
  if (!issue) throw new AppError("Issue not found", 404);

  if (issue.userId.toString() !== requestingUserId)
    throw new AppError("Forbidden: you do not own this issue", 403);

  return issue;
};
