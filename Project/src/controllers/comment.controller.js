import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
//make method to get comment from a video

/*const getVideoComments= asyncHandler(async (req,res)=>{
 const user= User.aggregate([
    {
        //first pipline to get match user in db through _id
        $match:{
            id: mongoose.Schema.Types.ObjectId(req.user._id)
        }
    },{
        //in second pipline we will collect video id from videos collection
        $lookup:{
            from:"videos",
            localField:"video",
            foreignField:"_id",
            as:"video"
        },
        //we want to send owner inform in the same data set thats why nested pipline
        pipeline:[
            {
                $lookup:{
                    from: "users",
                    localField:"owner",
                    foreignField: "_id",
                    as:"owner"
                }
            }
        ]
    }
 ])
 //send response to user
 res.status(200)
 .json(new ApiResponse(200,user,"Comment added successfully!"))
})

export {getVideoComments}*/

//controller to add comment in a video

const getVideoComment= asyncHandler(async(req,res)=>{
    //to get video comments we need video id on which we have to give comments
    //we can take it from params (url of the video played by the user)
    const{videoId}= req.params;
    
    //removing whitespaces in videoId
    (videoId?.trim()==="")
    
    //check if it is present in db or not
    const videoDetails= await Video.findById(videoId);
    
    //valdiation for VideoId
    if(!videoDetails) throw new ApiError(400,"Invalid Video Id!");

    //ok at this condition we we have details of video and videoId has been validated
    //now we have to get comments from videoId using pipelines
    const video = await Video.aggregate([
        {
            //first find video by videoId in db using $match
            $match:{
                id: videoId
            }
        },
        {
            //so we got all the documents which has this videoId
            //now lookup in comments collection where VideoID is this
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as: "Comments"
            },
            
        },
        
        {
            //now we got the array of comments on this VideoId
            //now we add a field in Video about the no of comments
            $addFields:{
                Comments:{
                    $size:"$Comments"
                }
            },
        },
        {
            //now we have added a field comments in Video document 
            //now we have to project comments with username of user
            
            $project:{
                _id :1,
                Comments: 1,
            }
        }
        
    ])
    //now we have added total comments in a video 
    //now we have to send a response to user
    return res.status(200)
    .json(new ApiResponse(200,video[0],"Comments have been fetched successfully!"))
    
})
// Add a Comment in Video

const AddComment = asyncHandler(async(req,res)=>{
    //get comment from body, since user will be login to add comment so here not need to verify we we add middleware to check
    const comment= req.body.comment
    const VideoID = req.params.VideoID

    const user= req.user._id
    //validation 
    if(!comment) throw new ApiError(400,"Comment is Empty!");
    //create comment object in db and add comment
    const commentDetails = await Comment.create({
        content: comment ,
        //video :"jgfnjgdjbgj"|| " "//: VideoId,
        owner : user,
        video : VideoID,
    })

    //send response to user 
    return res.status(200)
    .json(new ApiResponse(200,commentDetails,"Comment added Successfully!"))

})

//Update a Comment in Video

const UpdateComment = asyncHandler(async(req,res)=>{
    // take the updated comment from user
    const{comment} = req.body
    const VideoID = req.params.VideoID
    const user= req.user.id;

    /*Approach: we are thinking to use pipeline to update comment 
    first using $match method we will find documents with userid after selecting 
    such documents we will find the comments in comments collection by user and using set 
    method to update such values and project them*/

    const updatedcomm = await Video.aggregate([
        {
            $match: VideoID
        },
        {
            $lookup:{
                from : "comments",
                localField: "_id",
                foreignField: "video"
            }
        }
    ])



})

export {getVideoComment, AddComment}