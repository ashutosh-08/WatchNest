import mongoose,{Schema} from "mongoose";
import mongooseAgrregatorPaginate from "mongoose-aggregate-paginate-v2";

const subscriptionSchema= new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,// one who is subscribing is also a user to importing its id from db
        ref: "User",
        require:true,
    },
    channel:{
        type: Schema.Types.ObjectId,// where user subscribing
        ref:"User",
        require: true,
    }
},{timestamps:true})
export const Subscription = mongoose.model("Subscription",subscriptionSchema)