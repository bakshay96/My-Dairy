//import {v2 as cloudinary} from 'cloudinary';
const cloudinary=require("cloudinary").v2;
const fs=require("fs");
require("dotenv").config();


cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: CLOUDINARY_API_SECRET_KEY
  });

  const uploadOnCloudinary=async (localFilepath)=>{
    try {
        if(!localFilepath)
        {
            return null
        }
         const response=await cloudinary.uploader.upload(localFilepath, {
            resource_type:"auto"
        });

        // file has been uploaded successfully
        console.log("file is uplaoded on cloudinary",response);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilepath)  //remove the locally saved teporary file as the upload operation got faile
        console.log(error.message)
        return null;
    }
  }

  module.exports={
    uploadOnCloudinary
  }