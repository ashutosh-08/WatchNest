import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const toHttps = (url) => {
    if (!url || typeof url !== "string") return url;
    return url.replace(/^http:\/\//i, "https://");
};

const mediaUrl = (assetOrUrl) => {
    if (!assetOrUrl) return "";
    if (typeof assetOrUrl === "string") return toHttps(assetOrUrl);
    return toHttps(assetOrUrl?.secure_url || assetOrUrl?.url || "");
};

const normalizeVideoMedia = (videoDoc) => {
    if (!videoDoc) return videoDoc;
    const video = typeof videoDoc.toObject === "function" ? videoDoc.toObject() : { ...videoDoc };
    video.videoFile = mediaUrl(video.videoFile);
    video.thumbnail = mediaUrl(video.thumbnail);
    if (video.ownerDetails) {
        video.ownerDetails = {
            ...video.ownerDetails,
            avatar: mediaUrl(video.ownerDetails.avatar),
        };
    }
    if (video.owner && typeof video.owner === "object") {
        video.owner = {
            ...video.owner,
            avatar: mediaUrl(video.owner.avatar),
        };
    }
    return video;
};

// Upload Video on App
const UploadVideo = asyncHandler(async (req, res) => {
    // Get data from body
    const { title, description, isPublished } = req.body;
    
    // Validation 
    if (!title || !description) throw new ApiError(400, "Title and description are mandatory!");
    
    // File upload paths
    const VideoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    // Validation for video
    if (!VideoLocalPath) throw new ApiError(400, "Video file is required!");
    
    // Upload to cloudinary
    const VideoFile = await uploadOnCloudinary(VideoLocalPath);
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);
    const videoFileUrl = mediaUrl(VideoFile);
    const thumbnailUrl = mediaUrl(thumbnailFile);

    // Validation check for successful upload
    if (!videoFileUrl) throw new ApiError(400, "Failed to upload video!");

    // Get duration from cloudinary response
    const Duration = VideoFile?.duration;

    // Get owner from authenticated user
    const user = req.user._id;

    // Create video in database
    const VideoData = await Video.create({
        title,
        description,
        videoFile: videoFileUrl,
        thumbnail: thumbnailUrl || "",
        duration: Duration || 0,
        isPublished: isPublished || true,
        owner: user,
        views: 0,
    });

    return res.status(201)
        .json(new ApiResponse(201, normalizeVideoMedia(VideoData), "Video Uploaded Successfully!"));
})


// Get video by ID with owner details
const getVideobyId = asyncHandler(async (req, res) => {
    const VideoID = req.params.VideoID;
    
    if (!VideoID) throw new ApiError(400, "Video ID is required!");

    if (!mongoose.Types.ObjectId.isValid(VideoID)) throw new ApiError(400, "Invalid Video ID!");
    
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(VideoID)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: {
                path: "$ownerDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                "ownerDetails._id": 1,
                "ownerDetails.username": 1,
                "ownerDetails.avatar": 1,
                "ownerDetails.fullName": 1
            }
        }
    ]);

    if (!video || video.length === 0) throw new ApiError(404, "Video not found!");
     
    return res.status(200)
        .json(new ApiResponse(200, normalizeVideoMedia(video[0]), "Video Fetched Successfully!"));
});


// Update Video metadata (description, title, thumbnail)
const UpdateVideo = asyncHandler(async (req, res) => {
    const VideoID = req.params.VideoID;

    if (!VideoID) throw new ApiError(400, "Video ID is required!");

    if (!mongoose.Types.ObjectId.isValid(VideoID)) throw new ApiError(400, "Invalid Video ID!");

    // Get inputs to be updated
    const { description, title } = req.body;

    if (!description || !title) throw new ApiError(400, "Title and description are required!");

    // Verify ownership
    const video = await Video.findById(VideoID);
    if (!video) throw new ApiError(404, "Video not found!");
    
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own videos!");
    }

    // Update thumbnail if provided
    let updatedFields = {
        title: title,
        description: description
    };

    if (req.file?.path) {
        const thumbnailLocalPath = req.file.path;
        const cloudinaryLink = await uploadOnCloudinary(thumbnailLocalPath);
        const secureThumbnail = mediaUrl(cloudinaryLink);

        if (!secureThumbnail) throw new ApiError(400, "Failed to upload thumbnail!");
        
        updatedFields.thumbnail = secureThumbnail;
    }

    const updatedVideo = await Video.findByIdAndUpdate(VideoID, {
        $set: updatedFields
    }, { new: true });
    
    return res.status(200)
        .json(new ApiResponse(200, normalizeVideoMedia(updatedVideo), "Video Updated Successfully!"));
});


// Delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const VideoID = req.params.VideoID;
    
    if (!VideoID) throw new ApiError(400, "Video ID is required!");

    if (!mongoose.Types.ObjectId.isValid(VideoID)) throw new ApiError(400, "Invalid Video ID!");

    const video = await Video.findById(VideoID);
    
    if (!video) throw new ApiError(404, "Video not found!");

    // Verify ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own videos!");
    }

    await Video.findByIdAndDelete(VideoID);

    return res.status(200)
        .json(new ApiResponse(200, {}, "Video Deleted Successfully!"));
});

// Toggle video publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const VideoID = req.params.VideoID;

    if (!VideoID) throw new ApiError(400, "Video ID is required!");

    if (!mongoose.Types.ObjectId.isValid(VideoID)) throw new ApiError(400, "Invalid Video ID!");

    const video = await Video.findById(VideoID);

    if (!video) throw new ApiError(404, "Video not found!");

    // Verify ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only toggle publish status of your own videos!");
    }

    let toggle = video?.isPublished;
    
    if (toggle == null) throw new ApiError(500, "Toggle is NULL");

    toggle = !toggle;

    const VideoData = await Video.findByIdAndUpdate(VideoID, {
        $set: {
            isPublished: toggle
        }
    }, { new: true });

    return res.status(200)
        .json(new ApiResponse(200, VideoData, `Publish status is ${VideoData?.isPublished}`));
});

// Get all videos with pagination and search
const getAllVideos = asyncHandler(async(req,res)=>{
    const {page = 1, limit = 10, sortBy = 'createdAt', sortType = 'desc', query = ''} = req.query;

    // Build filter for search
    const filter = {
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ],
        isPublished: true
    };

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortType === 'asc' ? 1 : -1;

    const videos = await Video.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: {
                path: "$ownerDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $sort: sortObject
        },
        {
            $skip: (page - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                "ownerDetails._id": 1,
                "ownerDetails.username": 1,
                "ownerDetails.avatar": 1,
                "ownerDetails.fullName": 1
            }
        }
    ]);

    const totalVideos = await Video.countDocuments({ ...filter });

    return res.status(200)
    .json(new ApiResponse(200, {
        videos: videos.map(normalizeVideoMedia),
        totalVideos,
        page: parseInt(page),
        totalPages: Math.ceil(totalVideos / parseInt(limit))
    }, "Videos fetched successfully!"))
})

// Get videos by specific user
const getUserVideos = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    const {page = 1, limit = 10} = req.query;

    if(!userId) throw new ApiError(400, "User ID is required!");

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: (page - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: {
                path: "$ownerDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                "ownerDetails._id": 1,
                "ownerDetails.username": 1,
                "ownerDetails.avatar": 1
            }
        }
    ]);

    const totalVideos = await Video.countDocuments({ owner: userId });

    return res.status(200)
    .json(new ApiResponse(200, {
        videos: videos.map(normalizeVideoMedia),
        totalVideos,
        page: parseInt(page),
        totalPages: Math.ceil(totalVideos / parseInt(limit))
    }, "User videos fetched successfully!"))
})

// Increment video views
const incrementVideoViews = asyncHandler(async(req,res)=>{
    const {VideoID} = req.params;

    if(!VideoID) throw new ApiError(400, "Video ID is required!");

    if(!mongoose.Types.ObjectId.isValid(VideoID)) throw new ApiError(400, "Invalid Video ID!");

    const video = await Video.findByIdAndUpdate(
        VideoID,
        {
            $inc: { views: 1 }
        },
        { new: true }
    );

    if(!video) throw new ApiError(404, "Video not found!");

    return res.status(200)
    .json(new ApiResponse(200, normalizeVideoMedia(video), "View count incremented!"))
})

export {UploadVideo, getVideobyId, UpdateVideo, deleteVideo, togglePublishStatus, getAllVideos, getUserVideos, incrementVideoViews}
