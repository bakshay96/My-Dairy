const express=require("express");
const cors=require("cors");
const { connection } = require("./src/connection/db");
const { UserRouter } = require("./src/User/userRoutes");
const { AdminRouter } = require("./src/Admin/adminRoutes");
const { MilkRouter } = require("./src/Milk/milkRoutes");
const { transporter } = require("./src/connection/mailConnection");


require("dotenv").config();
const PORT=process.env.PORT || 3030;

const app=express();
app.use(cors({origin:"*"}));
app.use(express.json());

app.get("/", async (req, res) => {
    res.sendFile(__dirname + "/utils/index.html");
  });
  


app.use("/api/admin",AdminRouter);
app.use("/api/user",UserRouter);
app.use("/api/milk",MilkRouter)

//server
app.listen(PORT, async ()=>{
    try {
        await connection
         
        console.log("DB connected successfully")
        console.log(`Server is running on port ${PORT}`)
        transporter.verify(function (error, success) {
            if (error) {
              console.log(error);
            } else {
              console.log("Server is ready to take our messages");
            }
          });
    } catch (error) {
        console.error(error);
    }
})