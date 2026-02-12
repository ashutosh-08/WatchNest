import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getVideobyId, togglePublishStatus, UpdateVideo, UploadVideo, getAllVideos, getUserVideos, incrementVideoViews } from "../controllers/video.controller.js";

const router = Router();

// Get all videos with search and pagination (public)
router.route("/").get(getAllVideos);

// Upload a new video (requires auth)
router.route("/upload").post(verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1,
        }
    ]),
    UploadVideo
);

// Get user's own videos (requires auth)
router.route("/my-videos").get(verifyJWT, getUserVideos);

// Get video by ID (public)
router.route("/:VideoID").get(getVideobyId);

// Increment video views (public)
router.route("/:VideoID/views").post(incrementVideoViews);

// Update video metadata (requires auth + ownership)
router.route("/:VideoID/update").patch(verifyJWT, upload.single("thumbnail"), UpdateVideo);

// Delete video (requires auth + ownership)
router.route("/:VideoID/delete").delete(verifyJWT, deleteVideo);

// Toggle publish status (requires auth + ownership)
router.route("/:VideoID/toggle-publish").patch(verifyJWT, togglePublishStatus);

export default router;