const express=require("express");
const cors=require("cors");
const { connection } = require("./connection/db");
const { adminRouter } = require("./routes/adminRoutes");
require("dotenv").config();
const PORT=process.env.PORT || 3030;

const app=express();
app.use(cors());
app.use(express.json());

app.get("/dms",(req,res)=>{
    res.send("Welcome to Home page of Daily Milk Management System");
})

app.use("/dms",adminRouter);

//server
app.listen(PORT, async ()=>{
    try {
        await connection
        console.log("DB connected successfully")
    } catch (error) {
        console.error(error);
    }
    console.log(`Server is running on port ${PORT}`)
})