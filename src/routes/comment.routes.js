import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { AddComment, getVideoComment, UpdateComment, DeleteComment } from "../controllers/comment.controller.js";

const router = Router();

// Route to get all comments on a video (No auth required)
router.route("/:videoId").get(getVideoComment);

// Route to add a comment on a video (Auth required)
router.route("/:videoId/add").post(verifyJWT, AddComment);

// Route to update a comment (Auth required)
router.route("/:commentId/update").patch(verifyJWT, UpdateComment);

// Route to delete a comment (Auth required)
router.route("/:commentId/delete").delete(verifyJWT, DeleteComment);

export default router;