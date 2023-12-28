const express=require("express");
const cors=require("cors");
const { connection } = require("./src/connection/db");
const { UserRouter } = require("./src/User/userRoutes");
const { AdminRouter } = require("./src/Admin/adminRoutes");
const { MilkRouter } = require("./src/Milk/milkRoutes");


require("dotenv").config();
const PORT=process.env.PORT || 3030;

const app=express();
app.use(cors({origin:"*"}));
app.use(express.json());

app.get("/", async (req, res) => {
    res.sendFile(__dirname + "/utils/index.html");
  });
  


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