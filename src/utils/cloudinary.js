import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

const toHttps = (url) => {
    if (!url || typeof url !== "string") return url;
    return url.replace(/^http:\/\//i, "https://");
};

const ensureCloudinaryConfigured = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary env vars missing: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
};

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        ensureCloudinaryConfigured();
        
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
