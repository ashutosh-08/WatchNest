//This middleware identify if the user exist or not

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
// why we need to verify JWT because when we login the user we have given him access and refresh tokens so on this basis
// we will verify the user that its a true login or not, if you are true login means you have correct access and refresh token.
// we must not forget when we write middleware we use the next object also that after 
// completion you want to go to next middleware you can go you want to go to route you can go.
// we have to refreshToken acess but remember we have passed the app.cookieParser which gives req to acess the cookie
//we have check the condition(?) acesstoken exist or not, but why not they exist if we have given them remeber the case when we give t
// them in mobile application so may be user sending us custom header
// jwt passes authrorization : Bearer AccessToken , so what we do we replace the Bearer keyword with an empty "" 
// so we get direct authorization : AccessToken
// so at this point we can get token from cookies or authorization,
// so verify the token

const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "").trim();
        
        if(!token){
            throw new ApiError(401,"Unauthorized Request!")
        }
        
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        
        if(!user) throw new ApiError(401,"Invalid Access Token")
    
        req.user = user;
        next() 
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token!")
    }
})  


export {verifyJWT}
