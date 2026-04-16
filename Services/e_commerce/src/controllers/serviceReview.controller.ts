import { Request, Response, NextFunction } from "express";
import * as svc from "../services/serviceReview.service";

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userName, userAvatarUrl, rating, comment} = req.body;
    const { id: userId, company: companyId } = (req as any).user!;
    const result = await svc.createServiceReview(
      userId,
      companyId,
      userName,
      userAvatarUrl,
      rating,
      comment
    );
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

export const getReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await svc.getPublicReviews(page, limit));
  } catch (e) {
    next(e);
  }
};

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await svc.getPublicReviewStats());
  } catch (e) {
    next(e);
  }
};
