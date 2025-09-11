import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import pool from "./src/config/db.js"
import logger from "./src/utils/logger.js"
import "./src/cron/updateInsuranceStatus.js"
const app = express()
dotenv.config()

import adminRouter from "./src/routes/adminRouter.js"
import userRouter from "./src/routes/userRouter.js"

app.use(cors())
app.use(express.json())
app.use(express.static("uploads"));

 app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err); //  log all unhandled errors
  res.status(500).json({ message: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { message: err.message, stack: err.stack });
  process.exit(1);
});
 


const PORT = process.env.PORT || 4401


app.use("/api",adminRouter)
app.use("/api",userRouter)
app.get("/",(req,res)=>{
    res.send("Welcome to homepage")
})

app.listen(PORT,()=>{
    console.log(`Server listening on port : ${PORT}`)
    
})
