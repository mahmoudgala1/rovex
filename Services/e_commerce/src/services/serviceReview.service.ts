import { ServiceReview } from "../models/ServiceReview";
import { AppError } from "../utils/AppError";

export const createServiceReview = async (
  userId: string,
  companyId: string,
  userName: string,
  userAvatarUrl: string,
  rating: number,
  comment?: string,
) => {
  await ServiceReview.create({
    userId,
    companyId,
    userName,
    userAvatarUrl,
    rating,
    comment,
  });
  return { message: "Review submitted successfully" };
};

export const getPublicReviews = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [reviews, totalReviews, avgResult] = await Promise.all([
    ServiceReview.find({ isVisible: true })
      .select("userName rating comment createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ServiceReview.countDocuments({ isVisible: true }),
    ServiceReview.aggregate([
      { $match: { isVisible: true } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]),
  ]);

  return {
    averageRating: avgResult[0]?.avg ? +avgResult[0].avg.toFixed(1) : 0,
    totalReviews,
    reviews,
  };
};

export const getPublicReviewStats = async () => {
  const result = await ServiceReview.aggregate([
    { $match: { isVisible: true } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return {
    averageRating: result[0]?.avg ? +result[0].avg.toFixed(1) : 0,
    totalReviews: result[0]?.count ?? 0,
  };
};
