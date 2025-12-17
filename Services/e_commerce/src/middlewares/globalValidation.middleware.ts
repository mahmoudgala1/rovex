import { Request, Response, NextFunction } from 'express';
import { API_Response } from '../types/response.types';

// This function takes a list of field names (strings)
export const validateRequiredFields = (fields: string[]) => {
    
    // It returns the actual middleware function
    return (req: Request, res: Response, next: NextFunction) => {
        const missingFields: string[] = [];

        // Check if each field exists in req.body
        for (const field of fields) {
            // We use Object.prototype.hasOwnProperty to be safe
            if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
                missingFields.push(field);
            }
        }

        // If any fields are missing, stop the request
        if (missingFields.length > 0) {
            const response: API_Response<any> = {
                success: false,
                message: `Validation Error: Missing required fields: ${missingFields.join(', ')}`
            };
            res.status(400).json(response);
            return; // STOP execution here
        }

        // If all good, proceed to the controller
        next();
    };
};