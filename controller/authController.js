const User=require("../models/User");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//Generate json web token
const generateToken=(userId)=>{
    return jwt.sign({id:userId},process.env.JWT_SECRET,{expiresIn:"7d"});
};

const sendAuthResponse = (res, statusCode, user) => {
    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);
    return res.status(statusCode).json({
        _id:user._id,
        name:user.name,
        email:user.email,
        profileImageUrl:user.profileImageUrl,
        token,
    });
};

// @desc Register new user
// @route POST/api/auth/register
// @access Public
const registerUser=async(req,res)=>{
    
    try{
        const {name,email,password,profileImageUrl}=
        req.body;

        if(!name || !email || !password)
        {
            return res.status(400).json({message:"Name, email and password are required"});
        }

        if(!emailRegex.test(email))
        {
            return res.status(400).json({message:"Please provide a valid email address"});
        }

        if(password.length < 8)
        {
            return res.status(400).json({message:"Password must be at least 8 characters"});
        }

        //Check if user already exists
        const userExists=await User.findOne({email: email.toLowerCase()});
        if(userExists)
        {
            return res.status(400).json({message:"User already exists"});
        }

        //Hash password
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);

        //Create new user
        const user= await User.create({
            name: name.trim(),
            email: email.toLowerCase(),
            password:hashedPassword,
            profileImageUrl,
        });

        return sendAuthResponse(res, 201, user);
    } catch(error)
    {
        res.status(500).json({message:"Server error",error:error.message});
    }
}

// @desc Login user
// @route POST/api/auth/login
// @access Public

const   loginUser= async(req,res)=>{
    try{
        const {email,password}=req.body;
        if(!email || !password)
        {
            return res.status(400).json({message:"Email and password are required"});
        }

        const user=await User.findOne({email: email.toLowerCase()});
        if(!user)
        {
            return res.status(401).json({message:"Invalid email or password"});
        }

        //compare passwords

        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch)
        {
            return res.status(401).json({message:"Invalid email or password"});
        }

        //return user data with jwt
        return sendAuthResponse(res, 200, user);
    }
        catch(error) {
        res.status(500).json({message:"Server error",error:error.message});
    }
}

// @desc Get user profile
// @route POST/api/auth/profile
// @access Private (Requires JWT)

const getUserProfile=async(req,res)=>{
    try{
        const user=await User.findById(req.user.id).select("-password");
        if(!user)
        {
            return res.status(404).json({message:"User not found"});
        }
        res.json(user);
    }catch(error) {
        res.status(500).json({message:"Server error",error:error.message});
    }
}

const logoutUser=(req,res)=>{
    res.clearCookie("token", cookieOptions);
    res.status(200).json({message:"Logged out successfully"});
};

module.exports={registerUser,loginUser,getUserProfile,logoutUser};
