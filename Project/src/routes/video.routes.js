import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"
import { deleteVideo, getVideobyId, togglePublishStatus, UpdateVideo, UploadVideo } from "../controllers/video.controller.js"
import { AddComment,getVideoComment } from "../controllers/comment.controller.js"

const router = Router()

//using middleware upload to upload file before routing (tested!)
router.route("/UploadVideo").post(verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount:1
        },
        {
            name: "thumbnail",
            maxCount:1,
        }
    ])
,UploadVideo)

//get video by id (tested!)

router.route("/v/get-video/:VideoID").post(verifyJWT,getVideobyId);

// update Video meta data (tested!)

router.route("/v/update-video/:VideoID").patch(verifyJWT,upload.fields([
    {
        name : "thumbnail",
        maxCount: 1
    }
]),UpdateVideo)

// delete Video (tested!)

router.route("/v/delete-video/:VideoID").post(verifyJWT,deleteVideo)

// toggle publish status (tested!)

router.route("/v/toggle-publish/:VideoID").patch(verifyJWT,togglePublishStatus)

// COMMENTS ROUTE

//get video comments

router.route("/v/:VideoID/get-comments").post(verifyJWT,getVideoComment)

// route to add Comment

router.route("/v/:VideoID/add-Comment").post(verifyJWT,AddComment)



export default router