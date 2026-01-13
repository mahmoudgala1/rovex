
import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
   
      company?: string;
      product?: import('../types').IProduct;
      user?: import('../types').IUser;
    }
  }
}

export {}; 