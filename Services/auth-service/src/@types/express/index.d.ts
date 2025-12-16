import { JWTPayload } from "../../types/index";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      company_id?: string;
    }
  }
}
