import express from "express"
import {globalErrorHandeler} from "./middlewares/globalerror.middleware"
const app = express();

app.use(express.json())






app.use(globalErrorHandeler);

export default app;