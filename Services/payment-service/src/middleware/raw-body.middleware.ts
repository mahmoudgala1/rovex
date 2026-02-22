import { Request, Response, NextFunction } from "express";
import express from "express";

export function rawBodyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path.includes("/webhooks/")) {
    express.raw({ type: "application/json" })(req, res, (err) => {
      if (err) return next(err);
      if (Buffer.isBuffer(req.body)) {
        (req as any).rawBody = req.body.toString("utf8");
        try {
          req.body = JSON.parse((req as any).rawBody);
        } catch (e) {}
      }
      next();
    });
  } else {
    express.json()(req, res, next);
  }
}
