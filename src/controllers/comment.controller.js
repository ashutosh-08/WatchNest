import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";

//Controller to get all comments on a video

const getVideoComment = asyncHandler(async (req, res) => {
    //to get video comments we need video id from params
    const { videoId } = req.params;

    //validation for videoId
    if (!videoId?.trim()) {
        throw new ApiError(400, "Video ID is required!");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID!");
    }

    //check if video exists in db
    const videoDetails = await Video.findById(videoId);

    if (!videoDetails) {
        throw new ApiError(404, "Video not found!");
    }

    //get all comments on this video with user details
    const comments = await Comment.aggregate([
        {
            //match comments for this video
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            //lookup to get owner details
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            //unwind owner details
            $unwind: {
                path: "$ownerDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            //project required fields
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                "ownerDetails.username": 1,
                "ownerDetails.avatar": 1,
                "ownerDetails.fullName": 1
            }
        },
        {
            //sort by newest first
            $sort: {
                createdAt: -1
            }
        }
    ]);

    return res.status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully!"));
});
//Add a Comment on a Video

const AddComment = asyncHandler(async (req, res) => {
    //get comment from body and videoId from params
    const { content } = req.body;
    const { videoId } = req.params;

    const userId = req.user._id;

    //validation for content
    if (!content?.trim()) {
        throw new ApiError(400, "Comment cannot be empty!");
    }

    if (!videoId?.trim()) {
        throw new ApiError(400, "Video ID is required!");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID!");
    }

    //check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found!");
    }

    //create comment in db
    const comment = await Comment.create({
        content: content.trim(),
        owner: userId,
        video: videoId
    });

    //populate owner details
    await comment.populate("owner", "username avatar fullName");

    return res.status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully!"));
});

//Update a Comment

const UpdateComment = asyncHandler(async (req, res) => {
    //get updated content from body and commentId from params
    const { content } = req.body;
    const { commentId } = req.params;

    const userId = req.user._id;

    //validation
    if (!content?.trim()) {
        throw new ApiError(400, "Comment cannot be empty!");
    }

    if (!commentId?.trim()) {
        throw new ApiError(400, "Comment ID is required!");
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment ID!");
    }

    //check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found!");
    }

    //verify that user is the owner of the comment
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only update your own comments!");
    }

    //update the comment
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content: content.trim() },
        { new: true }
    ).populate("owner", "username avatar fullName");

    return res.status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully!"));
});

//Delete a Comment

const DeleteComment = asyncHandler(async (req, res) => {
    //get commentId from params
    const { commentId } = req.params;

    const userId = req.user._id;

    //validation
    if (!commentId?.trim()) {
        throw new ApiError(400, "Comment ID is required!");
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment ID!");
    }

    //check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found!");
    }

    //verify that user is the owner of the comment
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own comments!");
    }

    //delete the comment
    await Comment.findByIdAndDelete(commentId);

    return res.status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully!"));
});

export { getVideoComment, AddComment, UpdateComment, DeleteComment };