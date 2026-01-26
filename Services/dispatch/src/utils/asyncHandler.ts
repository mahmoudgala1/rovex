import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFunction = (
    req: Request<any, any, any, any>, 
    res: Response, 
    next: NextFunction
) => Promise<any>;
export const asyncHandler = (fn: AsyncFunction): RequestHandler => {
    // We mark the returned middleware as 'async'
    return async (req, res, next) => {
        try {
            // We explicitly await the controller logic
            await fn(req, res, next);
        } catch (error) {
            // If it crashes, we pass the error to the next middleware (Global Error Handler)
            next(error);
        }
    };
};