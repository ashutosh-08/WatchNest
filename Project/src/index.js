import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:"./.env"
})

connectDB()

//since conncetDB uses asynch method which retruns a promise
//AFTER DB CONNECTION

.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is listening at: ${process.env.PORT}`)
    })
})
.catch((error)=>{
    return console.log('MONGO DB Connection Failed!!',error);
})






//FIRST APPROACH
/*1. function connectDB(){}
connectDB()

2. //using ifis 
    /*This is a good approach no doubt but through this we have polluted the index file
    ;(async()=>{
        try{
            await mongoose.connect(`${process.env.MONGODB_URI}/ ${DB_NAME}`)
            //after db connection you can also see listners jo app ke pass hote hai jo kayi saari chije listen karte hai jaise
            //db connect hogaya hai par server listen nah kar paar raha toh 
            app.on("error",(error)=>{
                console.log("error",error);
                throw error
            })
            //agr sab sahi cahle to 
            app.listen(process.env.PORT,()=>{
                console.log(`app is listening on port ${process.env.PORT}`);
            })
        }
        catch(error){
            console.error("Error in DB connection, type:",error);
            throw error
        }
    })()
    //sometimes people before using the ifi put the ';' it is just 
    //the cleaner if by mistake one forget to add ';' in line above it wont generate error
    */
  //SECOND APPROACH
  // by making file db and connection it through connectDB() 