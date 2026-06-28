import { Request, Response } from "express";
import mongoose from "mongoose";
import { ContactUs, ContactStatus } from "../models/contactUs";

interface SubmitContactUsBody {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

interface UpdateStatusBody {
  status: ContactStatus;
}

interface GetAllQuery {
  status?: ContactStatus;
  page?: string;
  limit?: string;
}

export const submitContactUs = async (
  req: Request<{}, {}, SubmitContactUsBody>,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const contact = await ContactUs.create({
      name,
      email,
      phone: phone ?? null,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Your message has been received. We will get back to you soon.",
      data: {
        id: contact._id,
        createdAt: contact.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(err.errors).map((e) => e.message);
      res.status(400).json({ success: false, errors });
      return;
    }

    console.error("submitContactUs error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllContactUs = async (
  req: Request<{}, {}, {}, GetAllQuery>,
  res: Response,
): Promise<void> => {
  try {
    const { status, page = "1", limit = "20" } = req.query;

    const filter: Record<string, string> = {};
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [contacts, total] = await Promise.all([
      ContactUs.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-ipAddress"),
      ContactUs.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("getAllContactUs error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateContactUsStatus = async (
  req: Request<{ id: string }, {}, UpdateStatusBody>,
  res: Response,
): Promise<void> => {
  try {
    const validStatuses: ContactStatus[] = ["pending", "reviewed", "resolved"];
    const { status } = req.body;

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: "Invalid ID" });
      return;
    }

    const contact = await ContactUs.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!contact) {
      res.status(404).json({ success: false, message: "Contact not found" });
      return;
    }

    res.status(200).json({ success: true, data: contact });
  } catch (err) {
    console.error("updateContactUsStatus error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
