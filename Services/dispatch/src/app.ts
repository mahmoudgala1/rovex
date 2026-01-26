import express from "express"
import {globalErrorHandeler} from "./middlewares/globalerror.middleware"

const app = express();
app.use(express.json())



app.get("/", (req,res) => {


    res.send(" api is working ")
})



app.use(globalErrorHandeler);

export default app;