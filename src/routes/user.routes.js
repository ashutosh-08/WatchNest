import { Router } from "express";
import { registerUser, LoginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, UpdateAccountDetails, UpdateUserAvatar, UpdateUserCover, getUserChannelProfile, getUserWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);


router.route("/login").post(LoginUser);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);

// Route to refresh the access token
router.route("/refresh-token").post(refreshAccessToken);

// Route to change password (requires JWT)
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

// Get current user (requires JWT)
router.route("/get-user").get(verifyJWT, getCurrentUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);

// Update account details (requires JWT)
router.route("/update-account").patch(verifyJWT, UpdateAccountDetails);

// Update user avatar (requires JWT and file upload)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), UpdateUserAvatar);

// Update user cover image (requires JWT and file upload)
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), UpdateUserCover);

// Get user channel profile (public route, can optionally verify for subscription status)
router.route("/c/:username").get(getUserChannelProfile);

// Get user watch history (requires JWT)
router.route("/watch-history").get(verifyJWT, getUserWatchHistory);

export default router;
