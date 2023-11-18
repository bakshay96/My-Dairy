const mongoose=require("mongoose");
require("dotenv").config();

const mongo_url=process.env.mongo_url;
const connection=mongoose.connect(mongo_url);

module.exports={
    connection,
}