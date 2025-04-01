import { Router } from "express";
import { registerUser, LoginUser, logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,UpdateAccountDetails, UpdateUserAvatar, UpdateUserCover,getUserChannelProfile, getUserWatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js" 
import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router= Router()

router.route("/register").post(
    
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)


router.route("/login").post(LoginUser)

//secured routes
// here we use the verifyJwt middleware before passing our route request to logoutUser,
//  through this we can use as many middleware we want 

router.route("/logout").post(verifyJWT,logoutUser)

//route to refresh the refresh Token
router.route("/refresh-Token").post(refreshAccessToken)

// route to change password here we dont have to add any other middleware for hashing because we have already made

    //use the pre middleware and add it into our userschema which checks just before saving pass into db whenever a password is changed it hashes it  
    //verifyjwt middleware checks only authrorize user can perform this task
router.route("/change-password").post(verifyJWT,changeCurrentPassword) 

// get current user
router.route("/get-user").post(verifyJWT,getCurrentUser)

// we use patch,else it will post all data
router.route("/update-account").patch(verifyJWT,UpdateAccountDetails)
// Update Avatar here also one inform is update to swe use patch
//here we have to use multer middleware to take file from user but use it after verifyJWT because we want user to be verified first
//then we take the file
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),UpdateUserAvatar)
//Upload CoverImage
router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),UpdateUserCover)

// In Display the user profile Details we take data from params(url) so we ahve to write params
    // (first of all write the corse "/c/") whatever we write after ":" is important "/c/:username"
    //so here get is enough cause no data we are posting rather we are getting
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

//user watch history

router.route("/watch-history").get(verifyJWT,getUserWatchHistory)


export default router