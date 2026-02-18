import mongoose from "mongoose";
import { Subscription } from "../models/subsciption.models.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toHttps = (url) => {
    if (!url || typeof url !== "string") return url;
    return url.replace(/^http:\/\//i, "https://");
};

const normalizeSubscriberMedia = (subscriptionDoc) => {
    if (!subscriptionDoc) return subscriptionDoc;
    const item = typeof subscriptionDoc.toObject === "function"
        ? subscriptionDoc.toObject()
        : { ...subscriptionDoc };
    if (item.subscriber && typeof item.subscriber === "object") {
        item.subscriber = {
            ...item.subscriber,
            avatar: toHttps(item.subscriber.avatar),
        };
    }
    if (item.channel && typeof item.channel === "object") {
        item.channel = {
            ...item.channel,
            avatar: toHttps(item.channel.avatar),
        };
    }
    return item;
};

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user?._id;

    if (!subscriberId) {
        throw new ApiError(401, "Unauthorized Request!");
    }

    if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID!");
    }

    if (subscriberId.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel!");
    }

    const channelExists = await User.exists({ _id: channelId });
    if (!channelExists) {
        throw new ApiError(404, "Channel not found!");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    let isSubscribed = false;

    if (existingSubscription) {
        await Subscription.deleteOne({ _id: existingSubscription._id });
    } else {
        await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
        });
        isSubscribed = true;
    }

    const subscribersCount = await Subscription.countDocuments({ channel: channelId });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isSubscribed, subscribersCount },
            isSubscribed ? "Subscribed successfully!" : "Unsubscribed successfully!"
        )
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID!");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
            },
        },
        {
            $unwind: {
                path: "$subscriberDetails",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 1,
                channel: 1,
                createdAt: 1,
                subscriber: {
                    _id: "$subscriberDetails._id",
                    username: "$subscriberDetails.username",
                    fullName: "$subscriberDetails.fullName",
                    avatar: "$subscriberDetails.avatar",
                },
            },
        },
        {
            $sort: { createdAt: -1 },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers.map(normalizeSubscriberMedia), "Channel subscribers fetched successfully!"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID!");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
            },
        },
        {
            $unwind: {
                path: "$channelDetails",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 1,
                createdAt: 1,
                channel: {
                    _id: "$channelDetails._id",
                    username: "$channelDetails.username",
                    fullName: "$channelDetails.fullName",
                    avatar: "$channelDetails.avatar",
                },
            },
        },
        {
            $sort: { createdAt: -1 },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, subscribedChannels.map(normalizeSubscriberMedia), "Subscribed channels fetched successfully!"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
