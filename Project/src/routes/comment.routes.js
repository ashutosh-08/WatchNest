import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { AddComment, getVideoComment } from "../controllers/comment.controller.js";


const router= Router()



// route to add Comment

router.route("/v/add-Comment/:VideoID").post(verifyJWT,AddComment)

export default router