import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
} from "../controllers/subscription.controller.js";

const router = Router();

router.route("/c/:channelId").patch(verifyJWT, toggleSubscription);
router.route("/c/:channelId/subscribers").get(getUserChannelSubscribers);
router.route("/u/:userId/subscribed").get(getSubscribedChannels);

export default router;
