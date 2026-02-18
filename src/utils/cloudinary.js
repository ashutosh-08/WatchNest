import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

const toHttps = (url) => {
    if (!url || typeof url !== "string") return url;
    return url.replace(/^http:\/\//i, "https://");
};

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        // Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        const secureUrl = toHttps(response?.secure_url || response?.url);
        
        // File has been uploaded successfully
        console.log("File uploaded successfully on cloudinary!\n", secureUrl);
        
        // Remove the locally saved temporary file from server
        fs.unlinkSync(localFilePath);
        
        return {
            ...response,
            url: secureUrl,
            secure_url: secureUrl,
        };
    }   
    catch (error) {
        // Remove the locally saved temporary file on error
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        
        console.error("Error uploading to Cloudinary:", error);
        return null;
    }
};
    
export {uploadOnCloudinary}
