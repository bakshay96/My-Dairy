const express=require("express");
const cors=require("cors");
const { connection } = require("./connection/db");
const { UserRouter } = require("./User/userRoutes");
const { AdminRouter } = require("./Admin/adminRoutes");
const { MilkRouter } = require("./Milk/milkRoutes");


require("dotenv").config();
const PORT=process.env.PORT || 3030;

const app=express();
app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Welcome to Home page of Daily Milk Management System");
})


app.use("/admin",AdminRouter);
app.use("/user",UserRouter);
app.use("/milk",MilkRouter)

//server
app.listen(PORT, async ()=>{
    try {
        await connection
        console.log("DB connected successfully")
        console.log(`Server is running on port ${PORT}`)
    } catch (error) {
        console.error(error);
    }
})