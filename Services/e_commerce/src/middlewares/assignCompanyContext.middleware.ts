// src/middleware/context.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../utils/AppError';



export const assignCompanyContext = (req: Request, res: Response, next: NextFunction) => {
    
    let company: string | undefined;

    // 1. PRIORITY: Logged-in User Context
    if ((req as any).user && (req as any).user.company) {
        company = (req as any) .user.company;
    } 
    // 2. FALLBACK: Public Header (Storefront Visitors)
    else {
        company = req.headers['company-id'] as string;
       
    }

    // 3. VALIDATION: Prevent crashes and bad data
    if (!company) {
        return next(new AppError('Company Context Missing. Cannot handle requests please try again.', 400));
    }

    // 4. ATTACH: Make it easy for Controllers
    (req as any).company = company
    
    next();
};