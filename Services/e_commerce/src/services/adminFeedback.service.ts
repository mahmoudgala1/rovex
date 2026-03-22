import mongoose from "mongoose";
import { ServiceReview } from "../models/ServiceReview";
import { OrderIssue } from "../models/OrderIssue";
import { AppError } from "../utils/AppError";

/* ───── Service Reviews ───── */

export const adminGetReviews = async (
  companyId: string,
  filters: {
    rating?: number;
    is_visible?: boolean;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  },
) => {
  const query: any = { companyId};
  if (filters.rating !== undefined) query.rating = filters.rating;
  if (filters.is_visible !== undefined) query.isVisible = filters.is_visible;
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }

  const skip = (filters.page - 1) * filters.limit;
  const reviews = await ServiceReview.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(filters.limit)
    .lean();

  return { reviews };
};

export const adminGetReviewStats = async (companyId: string) => {

  const [reviewStats, lowRatings] = await Promise.all([
    ServiceReview.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: null,
          avg: { $avg: "$rating" },
          total: { $sum: 1 },
          count4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          count5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        },
      },
    ]),
    OrderIssue.countDocuments({ companyId}),
  ]);

  const s = reviewStats[0] ?? { avg: 0, total: 0, count4: 0, count5: 0 };
  return {
    averageRating: +s.avg.toFixed(1),
    totalReviews: s.total,
    lowRatings,
    breakdown: { "5": s.count5, "4": s.count4 },
  };
};

export const toggleReviewVisibility = async (
  companyId: string,
  id: string,
  is_visible: boolean,
) => {
  const review = await ServiceReview.findOneAndUpdate(
    { _id: id, companyId },
    { isVisible: is_visible },
    { new: true },
  ).lean();
  if (!review) throw new AppError("Review not found", 404);
  return { id: review._id, isVisible: review.isVisible };
};

/* ───── Order Issues ───── */

export const adminGetIssues = async (
  companyId: string,
  filters: {
    status?: string;
    type?: string;
    roverId?: string;
    rating?: number;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  },
) => {
  const query: any = { companyId };
  if (filters.status) query.status = filters.status;
  if (filters.type) query.issueType = filters.type;
  if (filters.roverId)
    query.roverId = new mongoose.Types.ObjectId(filters.roverId);
  if (filters.rating !== undefined) query.rating = filters.rating;
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }

  const skip = (filters.page - 1) * filters.limit;
  const [issues, total, openCount] = await Promise.all([
    OrderIssue.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .lean(),
    OrderIssue.countDocuments(query),
    OrderIssue.countDocuments({ ...query, status: "open" }),
  ]);

  return { total, open: openCount, issues };
};

export const adminGetIssueById = async (companyId: string, issueId: string) => {
  const issue = await OrderIssue.findOne({
    _id: issueId,
    companyId,
  }).lean();
  if (!issue) throw new AppError("Issue not found", 404);
  return issue;
};

export const adminUpdateIssueStatus = async (
  companyId: string,
  issueId: string,
  status: string,
  adminNote?: string,
) => {
  const update: any = { status };
  if (adminNote) update.adminNote = adminNote;
  if (status === "resolved") update.resolvedAt = new Date();

  const issue = await OrderIssue.findOneAndUpdate(
    { _id: issueId, companyId },
    update,
    { new: true },
  ).lean();
  if (!issue) throw new AppError("Issue not found", 404);

  return {
    id: issue._id,
    status: issue.status,
    resolvedAt: issue.resolvedAt,
    adminNote: issue.adminNote,
  };
};

/* ───── Dashboard ───── */

export const getDashboardFeedbackStats = async (companyId: string) => {

  const [reviewAgg, issueAgg, breakdownAgg, mostCommonAgg, roverAgg] =
    await Promise.all([
      ServiceReview.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            avg: { $avg: "$rating" },
            total: { $sum: 1 },
            r5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
            r4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          },
        },
      ]),
      OrderIssue.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      OrderIssue.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$issueType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      OrderIssue.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$issueType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      OrderIssue.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$roverId",
            roverName: { $first: "$roverName" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
    ]);

  const rv = reviewAgg[0] ?? { avg: 0, total: 0, r5: 0, r4: 0 };
  const statusMap = Object.fromEntries(
    issueAgg.map((i: any) => [i._id, i.count]),
  );
  const totalIssues = issueAgg.reduce((s: number, i: any) => s + i.count, 0);
  const roverMostIssues = roverAgg[0]
    ? {
        roverId: roverAgg[0]._id,
        roverName: roverAgg[0].roverName,
        count: roverAgg[0].count,
      }
    : null;

  return {
    averageRating: +rv.avg.toFixed(1),
    totalReviews: rv.total,
    totalIssues,
    openIssues: statusMap["open"] ?? 0,
    resolvedIssues: statusMap["resolved"] ?? 0,
    mostCommonIssue: mostCommonAgg[0]?._id ?? null,
    roverMostIssues,
    issueBreakdown: breakdownAgg.map((b: any) => ({
      type: b._id,
      count: b.count,
    })),
    ratingBreakdown: { "5": rv.r5, "4": rv.r4, "3": 0, "2": 0, "1": 0 },
  };
};
