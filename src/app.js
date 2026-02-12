import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app=express();

//MIDDLWARES

//CORS HANDLING
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
//Data from the body(eg. form submit)
app.use(express.json({limit:"16KB"}))

//Data from URL
app.use(express.urlencoded({
    extended:true,
    limit:"16KB"
}))
//Store images,pdf files in server for public acess
app.use(express.static("Public"))

//helps the server to take browser cookie and securely store them in browser where only server can read it or delete it
app.use(cookieParser()) 


//Routes import

import userRouter from "./routes/user.routes.js";

app.use("/users",userRouter)

//comment routes

import commentRouter from "./routes/comment.routes.js";
app.use("/comments",commentRouter)

// Video routes
import Videorouter from "./routes/video.routes.js"
app.use("/videos", Videorouter)

// Subscription routes
import subscriptionRouter from "./routes/subscription.routes.js";
app.use("/subscriptions", subscriptionRouter);

// 1. http://localhost:8000/users/register or login
//after "/users" all the users related routes will be inside user.routes. thats how urls are made

// 2. but in standard practice whenever you are using a api you have to define and its current version 
// so the url becomes http://localhost:8000/api/v1/users/register or login

// Routes Declearation

/* earlier when we make a server we pass the routes in app.get(/routes, ) directly
because our routes and controller are on the same page 
but now we have segregated the routes into a different file so to acces routes 
we have to use a middleware that will pass that routes request to userRoutes
 app.use("/users", userRoutes) // .use command is used to call the middleware*/

app.use((err, req, res, next) => {
    const statusCode = err?.statusCode || 500;
    const message = err?.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message,
        errors: err?.errors || [],
    });
});

export {app}
