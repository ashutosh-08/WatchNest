import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from  "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";


//acess and refresh token method
//always try to make variable name more readable and useful
//we dont need the asynchandler because we are not handling we request
// instead we are handling a internal function so its not required
//here user is a document or object which has all the properties defiend by us. 
const generateAcessandRefreshToken= async(userId)=>{
    try {
        // It will find the user based on userId provided
        const user=await User.findById(userId)
        // generate the refresh and acess Tokens from methods(which are built in user model called through user)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        // store the refreshToken in database(same as user.email so user.refreshToken already made in userSchema)
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}


// RESGISTER USER (tested!)
const registerUser= asyncHandler(async (req,res,)=>{

    /*res.status(200).json({
        message:"Hello this is my fist testing!"
    })*/
    
    //1. Take data from frontend
        //you can also say extracting data from req
    const {fullName,email,username,password}= req.body
    const normalizedFullName = fullName?.trim()
    const normalizedEmail = email?.trim()?.toLowerCase()
    const normalizedPassword = password?.trim()
    const normalizedUsername =
        username?.trim()?.toLowerCase() ||
        normalizedEmail?.split("@")?.[0] ||
        normalizedFullName?.replace(/\s+/g, "")?.toLowerCase()
    //console.log("This gives the details about the body",req.body)
    /*console.log("email",email);
    console.log("fullname",fullname);*/

    //2. VALIDATION FOR EMPTY FIELDS
        //throw below method we have to write if condition for many entities.
    
        /*if(fullname===""){
        throw new ApiError(400,"fullname is required")
        }*/
        //so in most cases we write it through this way.
    if (!normalizedFullName || !normalizedEmail || !normalizedPassword) {
        throw new ApiError(400,"Full name, email and password are required")
    }
    if (!normalizedUsername) {
        throw new ApiError(400,"Unable to generate username")
    }
    //3. Validation in exisitence of user
        //you can also say extracting data from req also use find function both are almost same findOne return the first found object
        //you can also say extracting data from req simply pass the username to check but we can also say extracting data from req give multiple condition through this. 
    const existedUser= await User.findOne(
        {
            $or:[{username: normalizedUsername},{email: normalizedEmail}]
        }
    )
    if(existedUser){
        throw new ApiError(409,"User email or username is already exists!");
    }
        //in routes we have added a middleware, it adds additional fields in request(req)
        //so in express req.body gives us access of bodies data, same way in multer gives us req.files gives us files access
        //it is used to take path of the file, avatar object gives many properties like png, jpg but 
        //we wants its first property which gives us path property[0] ,it can also say extracting data from req also be write as req.files.avatar.path
    
    //4. CHECK FOR IMAGES AND AVATAR
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
    //5. UPLOAD THEM TO CLOUDINARY
        //it takes time to upload file on clodinary so use, await
    const avatar= avatarLocalPath ? await uploadOnCloudinary(avatarLocalPath) : null
    const coverImage= coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedFullName)}&background=random`
    

    //6. CREATE USER OBJECT AND SEND DATA TO DATABASE
        //whenever we talk to db we get two problems: first we can also say extracting data from req get errors (we can also say extracting data from req handle it by asyncHandler) another is
        //db is in other continent so we use the await for it 
    const user =await User.create({
        fullName: normalizedFullName,
        avatar: avatar?.url || fallbackAvatar,
        coverImage:coverImage?.url || "",// coverimage can be empty also
        email: normalizedEmail,
        password: normalizedPassword,
        username: normalizedUsername,
    })
    //6.5 and 7, CHECK IF USER IS CREATED OR NOT 
        //the data given by you is not the only data created in mongodb, mongodb add an extra "_id" with every entity
        //now using this we can also say extracting data from req remove the password and refrence token by using "_id" property "select()"      
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
        //select function by default select everything in _id
        //so the entitiy we dont want to select we add it in the string with '-' sign,
        // and space as a sepearator between them
    )
    if(!createdUser) throw new ApiError(500,"Something went wrong while registering the user")

    //8. RESPONSE
        //you can directly send createdUser data into json
    return await res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully!")
    )
})

// LOGIN USER (tested!)

 const LoginUser= asyncHandler(async(req,res)=>{

    //1. Take data from user
    const { username, email, password } = req.body
    const normalizedUsername = username?.trim()?.toLowerCase()
    const normalizedEmail = email?.trim()?.toLowerCase()
    const normalizedPassword = password?.trim()
    
    //2. username and email validation
    if((!normalizedUsername && !normalizedEmail) || !normalizedPassword) {
        throw new ApiError(400,"Email/username and password are required!")
    }
    
    //3. Check user exists in databse through username or email
        //we can check it separately also eg: if(!User.findOne({username})) throw new ApiError(400,"Username is incorrect!")
    const user =await User.findOne({
        $or:[{username: normalizedUsername}, {email: normalizedEmail}]
     })

    if(!user) throw new ApiError(400,"User does't exist!")
    
    //4. check the user's password
    const isPasswordValid =await user.isPasswordCorrect(normalizedPassword)
    if(!isPasswordValid) throw new ApiError(400,"Invalid user credentials!")

    //5. Generate Acess and Refresh Tokens
        //since it will be a most frequent and usable code so make a method for your convenience
        //since the below method return us access and refresh Token, destructe it same as req.body 
    const {refreshToken,accessToken} =await generateAcessandRefreshToken(user._id)
    
    //6. Send them in cookie
        //since we have access the user data when we didnt pass the refreshToken here in this user variable the refreshToken is empty
        //so it is upto us either update the object(which is refreshToken) or another fire an call to database to acess details without sensitive details.
        // this is optional inform which you want to send to user after logged in 
        //this is during testing time i was receiving a error like converting circular structure to JSON, it was 
        //because when we fetch data from db it came into text format but we are sending data in json response so it convert the incoming data from
        //db into json thats why use .json in end.
        const LoggedInUser = await User.findById(user._id).select("-password -refreshToken")

        //whenever we want to send cookies we have to design options(basically a object) for cookies
        const isProduction = process.env.NODE_ENV === "production"
        const options = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        }
        // now we have to send user a response
         return res
         .status(200)
         .cookie("accessToken",accessToken,options)
         .cookie("refreshToken",refreshToken,options)
         .json(
            new ApiResponse(
                200,
                {
                user:LoggedInUser,accessToken,
                refreshToken
            },
            "User logged In Successfully"
        )
         )
} )

// LOGOUT USER (tested!)

const logoutUser= asyncHandler(async(req,res)=>{
    //For logout user it is an easy task 1. remove the cookies from user browser 2.remove refreshToken from database
    
    /* but here is a problem howto get user details we cant request user to again pass the username to logout
    so remember your old concept of middleware(ki jaa rahe ho! par mujhse milte jaana ) means before logout meet me, also remmber
    how we used to send the media files(images) through multer which is a middleware , what we used to do we attach the .files middleware to
    our req(which is a object) and send req.files and pass cookies through req.cookie etc also we use upload.fields which is a middleware and in same
    we use app.use(cookieParser()) here we are injecting the cookieParser middleware in app through which we can use it later like res.cookie, and we can access it twoway 
    in req and res , so through this we can also make our own custom middleware to logout
    and whenever user pass the request through req to logout we attach the req.customLogoutMiddleware */  
    // now we have made the middleware verifyJwt which add user details in req.user
     
    await User.findByIdAndUpdate(req.user._id,{
        $unset:{
            refreshToken: 1
        }
    },
        {
            new: true
        }
    )
    const isProduction = process.env.NODE_ENV === "production"
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax"
    }
    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options).json(
        new ApiResponse(200,"User Logged Out!")
    )
})//clear cookie take two parameter first cookie name in string and 2nd is options

// Refresh Access Token (tested!)

//this method will help user to login again by just clicking a button through refreshing the refreshToken
//we will first collect refreshToken from user through its cookies and match it with our stored refreshToken in db 
//and give acess to user

const refreshAccessToken=asyncHandler(async(req,res)=>{
    //take refresh token from user browser
    const incomingRefreshToken =req.cookies.refreshToken|| req.body.refreshToken
    // if user has no refresh token then through error
    if(!incomingRefreshToken) throw new ApiError(401,"Unauthorize Access!") 
    
    // now we decoded refresh token to verify,which we easily get from jwt.verify(token,secret) it gives decoded inform    
   try {
     const decodedToken =jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
     //since we decoded the refreshToken which has _id, so through this we can get access to user
     const user = await User.findById(decodedToken?._id)
     // if someone pass the fake refreshTOken and user didn't exist through error!
     if(!user) throw new ApiError(401,"Invalid refresh Token!") 
      
      if(incomingRefreshToken !== user?.refreshToken) throw new ApiError(401,"Refresh Token is expired or Used")
      
      //now give login access to user and generate random new Tokens 
      const isProduction = process.env.NODE_ENV === "production"
      const options={
         httpOnly:true,
         secure: isProduction,
         sameSite: isProduction ? "none" : "lax"
      }
      const {accessToken, refreshToken} =await  generateAcessandRefreshToken(user._id) 
      return res
      .status(200)
      .cookie("accessToken",accessToken,options )
      .cookie("refreshToken",refreshToken,options)
      .json(
         new ApiResponse(200,{
             accessToken, refreshToken
         },"Acess Token Refreshed!")
      )
   } catch (error) {
    throw new ApiError(401,"Invalid refresh Token!")
   }
})

//Change Current Password (tested!)

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    //Take data from user to change password
    const {oldPassword,newPassword,confirmPassword}= req.body

    // find user details from db by getting user id through req.user because req.user= user if it comes from autho
    const user= await User.findById(req.user._id)
    // call function to check password
    const checkoldPassword= await user.isPasswordCorrect(oldPassword) 
    if(!checkoldPassword) throw new ApiError(400,"Invalid Old Password!")
    //check if newPassword is equal to confirmPassword or not
    if(newPassword!=confirmPassword) throw new ApiError(400,"New Password is not equal to Confirm Password!")
    //if all correct then change the password
    //we didnt directly save the data in db using findandUpdateUserId because we want to run a middleware "save" before saving data into db
    user.password= newPassword
    //but before save data in db we have to call "save" middleware which bcrypt the user Password
    //we have call the "save" method from user because inside user.models save method is stored in userschema
    await user.save({validateBeforeSave:false})
    //response to user
    return res.status(200).json(new ApiResponse(200,"Password changed successfully!"))       
})

//Get Current User (tested!)

const getCurrentUser= asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"User fetched Successfully!"))
})

//Update Account Details (tested!)

const UpdateAccountDetails= asyncHandler(async(req,res)=>{
    const {fullName,email}= req.body
    //check if it is empty or not
    if(!fullName && !email) throw new ApiError(400,"Full Name and Email is required!")
    //fetch user data from db and directly update it because we dont have run any middleware before saving
    //data into db like in password updating where we have to pass it through "save" method to bcrypt the password
    const user= await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName,
                //you can also pass it through email:email just an eg
                email:email
            }
        },
        {new:true}).select("-password")
    //the third argument new:true gives the data of user after updation
    
    //send a response to user 
    res.status(200)
    .json(new ApiResponse(200,user,"Account Details Changed Successfully!"))    
})
//Advice if you have to update file in db like coverImage, Avatar then keep it in a different controller,endpoints
// it is a standard, if user only wants to update its image give save option and hit endpoint there,so we dont have to
//save whole user text data in db again and again to reduce the congestion in network.

// Update Avatar (tested!)

const UpdateUserAvatar= asyncHandler(async(req,res)=>{
    //Take input file from user since we have to take a single file so we use req.file instead of req.files middleware
    const AvatarLocalPath =req.file?.path
    //check 
    if(!AvatarLocalPath) throw new ApiError(400,"Upload avatar!")
    // upload on clodinary
    const avatar= await uploadOnCloudinary(AvatarLocalPath)
    //check if uploaded successfully or not
    if(!avatar.url) throw new ApiError(400,"Error in Uploading on avatar!")
    // upload in db
    const user= await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar: avatar.url
        }
    },{new:true}).select("-password")
    // send resopnse to user
    res.status(200)
    .json(new ApiResponse(200,user,"Avatar Changed Successfully!"))
})

// we use $set method to send update those data which we want not all the data

    //Upload CoverImage (tested!)

    const UpdateUserCover= asyncHandler(async(req,res)=>{
        //Take input file from user since we have to take a single file so we use req.file instead of req.files middleware
        const CoverLocalPath =req.file?.path
        //check 
        if(!CoverLocalPath) throw new ApiError(400,"Upload Cover image!")
        // upload on clodinary
        const coverImg= await uploadOnCloudinary(CoverLocalPath)
        //check if uploaded successfully or not
        if(!coverImg.url) throw new ApiError(400,"Error in Uploading on Cover img!")
        // upload in db
        const user= await User.findByIdAndUpdate(req.user?._id,{
            $set:{
                coverImage: coverImg.url
            }
        },{new:true}).select("-password")
        // send resopnse to user
        res.status(200)
        .json(new ApiResponse(200,user,"Cover img Changed Successfully!"))

})
//(tested!)
// Get user details to display on profile using aggrgation pipelines

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    //whenever we go to user profile we get user's username in url so we get users username through url
    //for it we use params
    const{username}= req.params
    //check
    if(!username?.trim()) throw new ApiError(400,"username is missing!")
    //now we find the user by username in db and gets it id and perform aggragtion piplines
    //but we dont have to do this long process, because we can directly fetch the user by writing a pipline with $match
    const channel = await User.aggregate([{
        // in first pipline we match the username with db
        $match:{
            username:username?.toLowerCase()
        }
    },
        {
            //In second pipline we perform the left join, means we add the subscription document data into user data
            //through $lookup method
            //we have find or match the user_id with ids of channel in diff documents
            $lookup: {
                from:"subscriptions",
                localField: "_id",
                foreignField:"channel",
                as:"subscribers"
            },
        },    
        {    
            //In this pipline we will write a pipline to find the channels subscribed
            //by the user by lookup method by matching user_id with subsciber
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribed"
            }
        },
        {
            //In this pipline we will add the additional pipelined data into user document
            // by addFields method
            
            $addFields:{
                Subscribers:{
                    //now we have to add the data we collected through lookup using $size method
                    //write in a string with $sign because it became a field
                    $size:"$subscribers"
                },
                Subscribed:{
                    //for subscribed channel
                    $size:"$subscribed"
                },
                isSubscribed:{
                    //It will give user information that he has subscibed the channnel or not
                    //using the $condition method{if,then,else} in $in(it can check in an object or in an array about a data)
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            //In this pipline we will project the data we want to project on to 
            //user profile using the $project method(it will project only selected fields)
            $project:{
                username:1,
                fullName:1,
                Subscribers:1,
                Subscribed:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,

            }
        }  
        
        
    ])
    //check if channel exists or not
    if(!channel.length) throw new ApiError(400,"Channel does not exist!")
     //send response to user
    res.status(200)
    .json(new ApiResponse(200,channel[0],"User channel fetched successfully!"))
        
})

//Get user watch History (tested!)

const getUserWatchHistory= asyncHandler(async(req,res)=>{

 //IMP  //the document stored by mongodb through _id is not actually 
    //a _id instead it is a string which gets converted through mongoose
    const user= await User.aggregate([
        {
            // find all the documents with _id
            $match:{
                //now here we are getting user id through req.user._id but as we discussed it
                //before, that id goes through mongoose is converted into mongodb string and then passed
                //but aggreagtion piplines code doesnt pass through mongoose it goes directly.
                //so we have to construct the mongoose object id
                
                _id: new mongoose.Types.ObjectId(req.user._id)

            }
        },
        {
            $lookup:{
                from: "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline :[
                    {
                        //remember in this pipline we are inside video so have to write piplines with reference to video
                        //we can write piplines inside pipelines called nested piplines
                        //it is used when we have to collect data from another document also
                        //here in our case owners data from user to show owner data in watchhistory
                         $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                //here we are using this pipline inside our video pipline which collect user data in owner
                                //but in owner we get users multiple detail in form of array but we have to project only few fields 
                                //so we use project
                                $project:{
                                    fullName:1,
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]
                         }
                    },
                    {
                        //this pipline has nothing to do with backend but just adding to give 
                        //easiness to fetch data from this api so, in frontend we
                        //dont have to take data from an array by traversing the array they will get it by "." method
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    //send response to user as we use user[0] because in aggregation pipline se user ki first value hi chahaiye
    //aur sirf watchhistory hi send karinge warna jada data bhejne ka kya matlab hai aur password aur token hatana bhi padega
    res.status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"watch history fetched successfully!"))
})




//STEPS REQUIRED TO MAKE A REGISTER PAGE
/*  1. get user details from frontend
    2. validation -not empty
    3. check if user is already exists:username , email
    4. check for images, check for avatar
    5. upload them to cloudinary, check avatar
    6. create user-object(because mongoDb is a no sql type where we have to make objects)
     create entry in db
    7. remove password and refresh token field from response
    8. check for user creation    
    9. return res

    all the users detail from frontend comes from req(it can also say extracting data from req come from body, form,json etc)*/


//STEPS REQUIRED TO MAKE LOGIN PAGE
/*  1. Take data from req.body
    2. check valiidation on email or username
    3. find the user in databse
    4. check password
    5. generate access and refresh token
    6.send them in cookie(we send secure cookies which stored in client's browser)
    7. send the response.*/

/* KEYNOTE: "req.files" refers to an object containing an array of uploaded files
 when multiple files are submitted under the same form field, while
  "req.file" refers to a single uploaded file object, used when only one file is expected per form field*/  

export {
    registerUser,
    LoginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    UpdateAccountDetails,
    UpdateUserAvatar,
    UpdateUserCover,
    getUserChannelProfile,
    getUserWatchHistory,
}
