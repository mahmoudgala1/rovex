
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { Types } from 'mongoose';

export const extractUserFromHeaders = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    
   //1. Extract user info from custom headers set by Nginx
    const user_id = req.headers['x-user-id'] ||null
     const user_role = req.headers['x-user-role'] ||null
     const user_type = req.headers['x-user-type'] as string  ||null
     const company_id = req.headers['x-company-id'] || null;

     if(user_role =="customer")
     {
        company_id=="company_x10"
     }
     //mokup data

    //  const user_id = "hassan123"
    //  const user_role = "admin"
    //  const user_type = "operator"   
    //  const company_id = "company_x33"

     console.log(user_id,user_role,user_type,company_id);
   
    // 2. Validate: If Nginx is configured correctly, these should NEVER be missing.
    if (!user_id || !user_role) {
        
        console.error(' SECURITY: Request received without Auth Headers. Possible Nginx Bypass attempt.');
    
    }

   

    // 3. Construct the User Object
    (req as any).user = {
        id: user_id,
        role: user_role,
        type: user_type ,
        company: company_id  
    };

    next();
});

export const restrictTo = (...allowedRoles: string[]) => {

    return (req: Request, res: Response, next: NextFunction) => {
    
        if (!(req as any).user || !allowedRoles.includes((req as any).user.role)) {
            return next(
               
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};