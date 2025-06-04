import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import pool from "./src/config/db.js"
const app = express()
dotenv.config()

import adminRouter from "./src/routes/adminRouter.js"
import userRouter from "./src/routes/userRouter.js"

app.use(cors())
app.use(express.json())
app.use(express.static("uploads"));


const PORT = process.env.PORT || 4401


app.use("/api",adminRouter)
app.use("/api",userRouter)
app.get("/",(req,res)=>{
    res.send("Welcome to homepage")
})

app.listen(PORT,()=>{
    console.log(`Server listening on port : ${PORT}`)
    
})
