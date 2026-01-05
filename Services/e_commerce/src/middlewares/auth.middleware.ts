
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

interface AuthUser {
    id: string;
    role: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            IUser?: AuthUser;
        }
    }
}

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new AppError('You are not logged in. Please provide a token.', 401);
    }

    try {
        // B. Validate Token with Auth Service
        const AUTH_URL = process.env.AUTH_SERVICE_URL + "/verify-token" || 'http://localhost:8000/api/v1/auth/verify-token';

        console.log("URL", AUTH_URL);
        const response = await axios.post(
            AUTH_URL, 
            {}, 
            {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000 
            }
        );

        const user = response.data.user;
        
        if (!user) {
            throw new AppError('Token validation failed. No user data returned.', 401);
        }

        req.user = user;
        next();

    } catch (error: any) {
       
        
        // Case 1: Auth Service responded with error (e.g., 401 Invalid Token)
        if (error.response) {
          
            const status = error.response.status;
            const message = error.response.data.message || 'Invalid Token';
            throw new AppError(message, status);
        } 
        
        // Case 2: Network Error or Timeout (Auth Service is down)
        if (error.request) {
            console.error('CRITICAL: Auth Service is unreachable!', error.message);
            throw new AppError('Authentication service unavailable. Try again later.', 503);
        }

        // Case 3: Code Logic Error
        console.error('Auth Middleware Error:', error);
        throw new AppError('Internal Authentication Error', 500);
    }
});


export const restrictTo = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
    
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};