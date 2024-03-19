import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please enter username"],
    },
    password: {
        type: String,
        required: [true, "Please enter password"],
    },
    slot: {
        type: Number,
        required: [true, "Please enter slot number"],
        // min max constraint for this needs to be added
    },teamName:{
        type:String, // mi cks rr
    }
    ,
    budget:{ 
        type:Number,
        required:[true,"invalid budget"],
        max:1000000000,
        min:0
    },
    score:{
        type:Number,
        required:[true,"invalid score"],
    },
    players:[{
        type:mongoose.Schema.ObjectId,
        ref:"Players"
    }],
    powercards:[{
        name:{type:String},
        isUsed:{type:Boolean}
    }]
}, { collection: 'User' }); 

const User = mongoose.model("User", userSchema);

export default User;

