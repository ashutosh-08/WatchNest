import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema= new mongoose.Schema({
    content:{
        type:String,
        require:true,
    },
    video:{
        type: mongoose.Schema.ObjectId,
        ref:"Video"
    },
    owner:{
        type: mongoose.Schema.ObjectId,
        ref:"User"
    }
},{timestamps:true})

//we want to load our comments in page format from where to where comment will be loaded
commentSchema.plugin(mongooseAggregatePaginate)

export const Comment= mongoose.model("Comment",commentSchema);