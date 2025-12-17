import { Request, Response,NextFunction } from "express";
import { API_Response } from "../types/response.types"
import { AppError } from "../utils/AppError";


export const globalErrorHandeler = (err :Error|AppError,req: Request,res:Response,next:NextFunction) =>{
    let message = "Internal Server Error"
    let statusCode = 500

    if(err instanceof AppError)
    {
        message = err.message
        statusCode = err.statusCode

    }
    else{
        console.log("bug: ",err)
    }

    const response :API_Response<any> = {
        success: false,
        message: message
    }
    res.status(statusCode).json(response);

}