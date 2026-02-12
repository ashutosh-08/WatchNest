import mongoose from "mongoose";

const playlistSchema= new mongoose.Schema({
    name:{
        type:string,
        require:true,
    },
    description:{
        type:string,
        require:true,
    },
    //videos will be a list of videos
    videos:[
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video",
        require:true,
    }],
    creator:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        require:true,
    }
},{timestamps:true})

export const Playlist = mongoose.model("Playlist",playlistSchema)