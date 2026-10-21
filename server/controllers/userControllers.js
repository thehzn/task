const User = require("../models/userSchema");
const { generateToken } = require("../utils/token");



exports.userRegister = async(req,res)=>{

    try{

const {name,email,password,age,role}=req.body;
console.log(req.body);

if(!name || !email || !password ||!age ){
    return res.status(400).json({
        message:"enter full details" ,
        success:false 
    });
}
const existinguser = await User.findOne({email});
if(existinguser){
     return res.status(400).json({ message: "Email already registered", 
        success: false });
}


  const user=await User.create({ name, email, password,age, role }); 
    
  const token =await generateToken(user._id,user.role); 
 
         res.status(201).cookie("token", token).json({
        message:"user registered succussfully" ,
        success:true,
        user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age:user.age,
        role: user.role,
        
      },
    });
    }
    catch(error){
         return res.status(500).json({
            message: error.message,
            success:false,
        });
    }


    
   
}

exports.userLogin = async(req,res)=>{
    try{
       
        
        const {email ,password} =req.body;


        if(!email || !password){
            return res.status(400).json({
        message:"enter full details" ,
        success:false 
     })}

       const user = await User.findOne({email}).select("+password");
   
       

       if(!user){
         return res.status(404).json({
        message:"user not found" ,
        success:false 
     })}


    const isMatch = await user.comparePassword(password);

     if(!isMatch){
         return res.status(401).json({
        message:"invalid credentials" ,
        success:false 
     })}


     const token = await generateToken(user._id,user.role);
     


     
     res.status(200).cookie('token',token).json({
       message:"user logged succussfully" ,
        success:true,
       user,
      
      
     });
    }
     catch(error){

         return res.status(500).json({
            message: error.message,
            success:false,
        });
     }
}


exports.userLogout =(req,res)=>{
     res.status(200).clearCookie("token").json({
        message:"user logged out successfully",
        success:true,
    })
}

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};