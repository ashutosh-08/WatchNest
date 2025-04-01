import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_NAME, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });

    const uploadOnCloudinary= async (localFilePath) => {
        try{
            if(!localFilePath) return null
            //else upload the file on cloudinary
            const response= await cloudinary.uploader.upload(localFilePath, {
                resource_type:"auto"
            })
            //file has been uploaded successfull
            console.log("File uploaded successfully on cloudinary!\n",response.url)
            fs.unlinkSync(localFilePath);
            return response;
        }   
        catch(error){
            //remove the locally save temperoray stored file server as file failed to upload
            fs.unlinkSync(localFilePath)
            return error;
        }
    }
    
export {uploadOnCloudinary}