import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";


//Upload Video on App
    //to upload video, user is already login

const UploadVideo= asyncHandler(async(req,res)=>{

    //First we need the data to upload take from body

    const{title, description,isPublished}= req.body
    //validation 
    if(!title || !description) throw new ApiError(400,"Title and description are mandatory!")
    
    //  File upload
    
    const VideoLocalPath= req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path

    //validation for video

    if(!VideoLocalPath) throw new ApiError(400,"Upload Video!");
    
    //once get the local path of video upload it on cloudinary
    const VideoFile = await uploadOnCloudinary(VideoLocalPath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)

    //validation check it its uploaded successfully or not
     if(!VideoFile) throw new ApiError(400,"Failed to Upload!")

    // Find duration in cloudinary link

    /*function getDurationfromCloudinary (VideoFile){
        const searchedParam= new URLSearchParams(VideoFile?.split('?')[1]);
        return  parseFloat(searchedParam.get('duration'));
    }*/
    const Duration= VideoFile?.duration

    //to give owner name
    const user = req.user._id;
    //so if files are uploaded than create video collection in mongodb

    const VideoData = await Video.create({
        title,
        description,
        videoFile : VideoFile?.url,
        thumbnail: thumbnailFile?.url,
        duration : Duration || 0 ,
        isPublished : isPublished ,
        owner : user,
        views: 0,

    })

    return res.status(200)
    .json(new ApiResponse(200,VideoData,"Video Uploaded Successfully!"))


})

const getVideobyId = asyncHandler(async(req,res)=>{

    const VideoID= req.params.VideoID;
    
    if(!VideoID) throw new ApiError(400,"Invalid!");
    
    const video = await Video.findById(VideoID);

    if(!video) throw new ApiError(400,"Video does not exists!");
     
    return res.status(200)
    .json(new ApiResponse(200,video,"Video Fetched Successfully!"))    

})

//Update Video related data like description,thumbnail

const UpdateVideo = asyncHandler(async(req,res)=>{

    //get the video to be updated through videoId
    const VideoID = req.params.VideoID
    //(VideoId?.trim()==="")

    if(!VideoID) throw new ApiError(400,"Invalid Video!");

    //get inputs to be updated
    const{description,title}= req.body

    if(!description || !title) throw new ApiError(400,"Fields are empty!");

    //thumbnail to be updated

    const thumbnailLocalPath = req.files?.thumbnail[0].path
    //upload on clodinary
    if(!thumbnailLocalPath) throw new ApiError(400,"Failed to Upload File in localpath!");

    const cloudinaryLink = await uploadOnCloudinary(thumbnailLocalPath);

    if(!cloudinaryLink) throw new ApiError(400,"Failed to Upload File!");
    
    const video = await Video.findByIdAndUpdate(VideoID,{
        $set:{
            title: title,
            description: description,
            thumbnail: cloudinaryLink[0]?.url
        }
    },{new:true})
    
    return res.status(200)
    .json(new ApiResponse(200,video,"Updated Successfully!"))

})

const deleteVideo = asyncHandler(async(req,res)=>{
    //get videoId 
    const VideoID = req.params.VideoID
    
    if(!VideoID) throw new ApiError(400,"Video does not exists!");

    const video = await Video.findByIdAndDelete(VideoID);

    return res.status(200)
    .json(new ApiResponse(200,video,"Video Deleted Successfully!"));

})

const togglePublishStatus = asyncHandler(async(req,res)=>{
    //get videoId
    const VideoID = req.params.VideoID

    if(!VideoID) throw new ApiError(400,"Inavalid Video!");

    const video = await Video.findById(VideoID);

    if(!video) throw new ApiError(400,"Video does not exists!");

    let toggle = video?.isPublished;
    
    if(toggle==null) throw new ApiError(500,"toggle is NULL");

    if(toggle==true) toggle = false;
    else toggle= true;

    const VideoData = await Video.findByIdAndUpdate(VideoID,{
        $set:{
            isPublished: toggle
        }
    },{new:true})

    return res.status(200)
    .json(new ApiResponse(200,VideoData,`Publish status is ${VideoData?.isPublished}`))

})
export {UploadVideo, getVideobyId,UpdateVideo,deleteVideo, togglePublishStatus}