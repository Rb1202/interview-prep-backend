const mongoose=require("mongoose");

const sessionSchema=mongoose.Schema(
    {
        user:{type:mongoose.Schema.Types.ObjectId, ref:"User",required:true},
        role: {type:String, required:true},
        experience:{type:String, required:true},
        topicsToFocus:{type:String,required:true},
        description: {type:String},
        questions:[{type:mongoose.Schema.Types.ObjectId,ref:"Question"}],
    },
    {timestamps:true});

module.exports=mongoose.model("Session",sessionSchema);