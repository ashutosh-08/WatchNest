import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async()=>{
    try{
        const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`)
        console.log(`\n MongoDB connected! DB HOST:${connectionInstance.connection.host}`);
    }
    catch(error){
        console.error("ERROR in db connection, TYPE:",error);
        process.exit(1) //nodejs provide process which gives the current process adress and can be ended through .exit command (with exit code)
    }
}
export default connectDB
//async because db in another contenent.
//connection.host and connect to the server because the database is different for production, different for development, different for testing.
//If it happens, then I should know which host I am connecting to