const { verifyToken } = require("../utils/token");

exports.userAuthenticate = async(req,res,next)=>{
    console.log("--- Auth Middleware Started ---");

    try{
    const {token} =req.cookies;
    if(!token){
         return res.status(401).json({
        message:"unautherised user" ,
        success:false  
    })
    }
    const decode = await verifyToken(token);
    console.log("Middleware Decoded Role:", decode?.userRole);
    req.userId = decode?.userId;
    req.userRole = decode?.userRole;
console.log("Auth Success: User ID set to", req.userId);
    next();
    
    
}
catch(error){
     return res.status(500).clearCookie("token").json({
            message: error.message,
            success:false,
        });
}
}


exports.userAutherize =(...permittedroles)=>{    

    return(req,res,next)=>{
       
        if(!permittedroles.includes(req?.userRole)){
              return res.status(403).json({
        message:"access denied" ,
        success:false  
    })
        }

        next();
    }
}