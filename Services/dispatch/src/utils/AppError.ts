export class AppError extends Error{
    public statusCode:number;
    public isOperational :boolean;

    constructor(messgae:string,statusCode:number)
    {
        super(messgae);
        this.statusCode = statusCode;
        this.isOperational = true; 
         Error.captureStackTrace(this, this.constructor);
    }
}