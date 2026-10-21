const jwt = require("jsonwebtoken");

exports.generateToken = async(userId,userRole)=>{
    return jwt.sign(
        {userId,userRole},
        process.env.JWT_SECRET,
        {expiresIn:process.env.JWT_EXPIRES_IN}
    );
};

exports.verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified successfully for user:", decoded.userId);
    return decoded;
  } catch (err) {
    console.error("JWT Verification Error:", err.message); // Will say "invalid signature" if secret is wrong
    throw err;
  }
};