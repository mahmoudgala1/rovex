
import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
   
      company?: Types.ObjectId;
      product?: import('../types').IProduct;
      user?: import('../types').IUser;
    }
  }
}

export {}; 