import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async()=>{
    try{
        const rawUri = process.env.MONGODB_URI?.trim();

        if (!rawUri) {
            throw new Error("MONGODB_URI is missing");
        }

        // If DB name is already present in the URI, use it as-is.
        // Otherwise append DB_NAME before query params.
        let mongoUri = rawUri;
        const hasDbInPath = /mongodb(\+srv)?:\/\/[^/]+\/[^?]+/.test(rawUri);
        if (!hasDbInPath) {
            const [base, query] = rawUri.split("?");
            const normalizedBase = base.endsWith("/") ? base : `${base}/`;
            mongoUri = `${normalizedBase}${DB_NAME}${query ? `?${query}` : ""}`;
        }

        const connectionInstance= await mongoose.connect(mongoUri)
        console.log(`\n MongoDB connected! DB HOST:${connectionInstance.connection.host}`);
    }
    catch(error){
        console.error("ERROR in db connection, TYPE:",error);
        process.exit(1) //nodejs provide process which gives the current process adress and can be ended through .exit command (with exit code)
    }
}
export default connectDB
//async because db in another continent.
//connection.host and connect to the server because the database is different for production, different for development, different for testing.
//If it happens, then I should know which host I am connecting to
