
import { Request, Response,NextFunction } from "express";

export  const LoggerMiddleware = (req: Request, res:Response,next:NextFunction)=>{

    console.log(`${req.method} \n ${req.url}`)


    return next();
}