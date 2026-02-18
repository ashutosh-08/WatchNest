import mongoose,{Schema} from "mongoose";
import mongooseAgrregatorPaginate from "mongoose-aggregate-paginate-v2";
const videoSchema= new Schema({
    videoFile:{
        type:String,
        required:true,
    },
    thumbnail:{
        type:String,
        required:true,
    },
    title:{
        type: String,
        required:true,
    },
    description:{
        type: String,
        required:true,
    },
    duration:{
        type: Number,//clodnary,aws provide the media infom like duration and link which will be extracted from there.
        required:true,
    },
    views:{
        type:Number,
        required:true,
        default: 0,
    },
    isPublished:{
        type: Boolean,
        default:true,
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref:"User",
    },
    storyboardStatus: {
        type: String,
        enum: ["none", "processing", "ready", "failed"],
        default: "none",
    },
    storyboardSpriteUrl: {
        type: String,
        default: "",
    },
    storyboardVttUrl: {
        type: String,
        default: "",
    },
    storyboardIntervalSec: {
        type: Number,
        default: 5,
    },
    storyboardThumbWidth: {
        type: Number,
        default: 160,
    },
    storyboardThumbHeight: {
        type: Number,
        default: 90,
    }
},{timestamps:true})

//mongooseAgrregatorPaginate it helps to provide video or any field in a page format to load more 
//we cant give all videos to user so it give us a functionality to load videos in page format
videoSchema.plugin(mongooseAgrregatorPaginate)

export const Video= mongoose.model("Video",videoSchema)
