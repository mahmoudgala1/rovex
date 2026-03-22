import { Request, Response, NextFunction } from "express";
import * as svc from "../services/adminFeedback.service";

export const getReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      rating,
      is_visible,
      from,
      to,
      page = "1",
      limit = "20",
    } = req.query as any;
    const companyId = (req as any).user!.company;
    res.json(
      await svc.adminGetReviews(companyId, {
        rating: rating !== undefined ? +rating : undefined,
        is_visible:
          is_visible !== undefined ? is_visible === "true" : undefined,
        from,
        to,
        page: +page,
        limit: +limit,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const getReviewStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = (req as any).user!.company;
    res.json(await svc.adminGetReviewStats(companyId));
  } catch (e) {
    next(e);
  }
};

export const updateVisibility = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = (req as any).user!.company;
    res.json(
      await svc.toggleReviewVisibility(
        companyId,
        req.params.id,
        req.body.is_visible,
      ),
    );
  } catch (e) {
    next(e);
  }
};

export const getIssues = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      status,
      type,
      roverId,
      rating,
      from,
      to,
      page = "1",
      limit = "20",
    } = req.query as any;
    const companyId = (req as any).user!.company;
    res.json(
      await svc.adminGetIssues(companyId, {
        status,
        type,
        roverId,
        rating: rating !== undefined ? +rating : undefined,
        from,
        to,
        page: +page,
        limit: +limit,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const getIssueById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = (req as any).user!.company;
    res.json(await svc.adminGetIssueById(companyId, req.params.issueId));
  } catch (e) {
    next(e);
  }
};

export const updateIssueStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status, adminNote } = req.body;
    res.json(
      await svc.adminUpdateIssueStatus(req.params.issueId, status, adminNote),
    );
  } catch (e) {
    next(e);
  }
};

export const getRoverIssues = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { roverId } = req.params;
    const {
      status,
      type,
      rating,
      from,
      to,
      page = "1",
      limit = "20",
    } = req.query as any;
    const companyId = (req as any).user!.company;
    res.json(
      await svc.adminGetIssues(companyId, {
        roverId,
        status,
        type,
        rating: rating !== undefined ? +rating : undefined,
        from,
        to,
        page: +page,
        limit: +limit,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const getRoverReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { roverId } = req.params;
    const {
      rating,
      is_visible,
      from,
      to,
      page = "1",
      limit = "20",
    } = req.query as any;
    // Re-uses adminGetReviews but pre-filters by roverId via the model directly
    const { ServiceReview } = await import("../models/ServiceReview");
    const query: any = { roverId };
    if (rating !== undefined) query.rating = +rating;
    if (is_visible !== undefined) query.isVisible = is_visible === "true";
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    const skip = (+page - 1) * +limit;
    const reviews = await ServiceReview.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(+limit)
      .lean();
    res.json({ reviews });
  } catch (e) {
    next(e);
  }
};

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = (req as any).user!.company;
    res.json(await svc.getDashboardFeedbackStats(companyId));
  } catch (e) {
    next(e);
  }
};
