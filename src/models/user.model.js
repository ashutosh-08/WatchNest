import mongoose,{Schema} from "mongoose";
import jwt from"jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema= new Schema({
    
    username:{
        type: String,
        require:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true //if an entity is used for frequent search make that entity's index true it will add entity into databse searches and make searches easy but bit costly.
    },
    email:{
        type: String,
        require:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type: String,
        require:true,
        trim:true,
        index:true //if an entity is used for frequent search make that entity's index true it will add entity into databse searches and make searches easy but bit costly.
    },
    avatar:{
        type: String, //cloudinary url
        require:true,
    },
    coverImage:{
        type: String, //cloudinary url
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId, 
            ref:"Video"
        }
    ],

    password: {
        type: String,
        require:[true,"Password is Required"],
    },
    refreshToken: {
        type:String,
    },
},{timestamps:true})

//Using Mongoose middleware "Pre"(which is a middleware that performs a task just before saving data in DB) 
//Using this we will hash our password just before saving it into the db
userSchema.pre("save",async function(next){
    
    if(!this.isModified("password")) return next();
     
    //if modified
    try {
        this.password= await bcrypt.hash(this.password, 10);
        next()
    } catch (error) {
        next(error)
    } //flag because it is a middleware.
});

//custom method to check correct password

userSchema.methods.isPasswordCorrect= async function(password){
   return await bcrypt.compare(password, this.password)
}

//both are jwt token, it just a matter of usage
//Tokens
userSchema.methods.generateAccessToken= function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName:this.fullName
      //payload name, key : comes from db
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }

)
}

userSchema.methods.generateRefreshToken= function(){
    return jwt.sign({
        _id: this._id,
        
      //payload name, key : comes from db
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }

)
}

//use same like app.listen(),also nerver write arrow function
//because in arrow function context is missing but here context matters 
//it takes time to encrypt pass so use async 
//now we have to write if condion because evertime data saves it encrypt it which we dont want so check it its modified

export const User= mongoose.model("User",userSchema)