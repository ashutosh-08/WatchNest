import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema({
    content:{
        type:String,
        require:true,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        require:true,
    }
},{timestamps:true})

export const Tweet = mongoose.model("Tweet",tweetSchema)