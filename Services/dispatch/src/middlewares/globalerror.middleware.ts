import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";


const handleCastErrorDB = (err: any) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any) => {
    // Get the duplicate data
    const keyValue = err.keyValue || {};
    
    //  Get all keys involved in the duplication (e.g. ['company', 'title'])
    const keys = Object.keys(keyValue);
    // 3. Prefer a non-user-related field for the error message
    const userField = keys.find(key => key !== 'company' && key !== 'user' && key !== '_id');

    // 4. Fallback: If for some reason we filtered everything out, just take the first key
    const finalField = userField || keys[0] || 'field';
    const value = keyValue[finalField];

    // 5. Generate the Message
    // Result: "The title 'iphone' is already taken. Please use another value!"
    const message = `The ${finalField} '${value}' is already taken. Please use another value!`;
    
    return new AppError(message, 400);
};  
const handleValidationErrorDB = (err: any) => {
    // Loop over all validation errors and join them
    const errors = Object.values(err.errors).map((el: any) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const sendErrorDev = (err: any, res: Response) => {
    res.status(err.statusCode).json({
        success: false,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err: any, res: Response) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    } 
    else {
        console.error('ERROR ', err);
        res.status(500).json({
            success: false,
            message: 'Something went very wrong!'
        });
    }
};

// ============================================================
// 2. MAIN MIDDLEWARE (The Exported Function)
// ============================================================

export const globalErrorHandeler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        // Clone the error object to modify it safely
        // Note: Spread syntax (...) sometimes misses the 'name' property of Errors
        let error = { ...err };
        error.message = err.message;
        error.name = err.name; 

        // 1. Handle Invalid Database IDs
        if (error.name === 'CastError') error = handleCastErrorDB(error);

        // 2. Handle Duplicate Database Fields
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);

        // 3. Handle Mongoose Validation Errors
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

        // 4. Handle JWT Errors (Optional)
        if (error.name === 'JsonWebTokenError') error = new AppError('Invalid token. Please log in again!', 401);
        if (error.name === 'TokenExpiredError') error = new AppError('Your token has expired! Please log in again.', 401);

        sendErrorProd(error, res);
    }
};