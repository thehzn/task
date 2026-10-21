const mongoose = require("mongoose");

const databaseConnection = async()=>{
 
   try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log("database connected ");
   } 
   catch(err){
     console.log("MongoDB connection error:", err);
     process.exit(1);
   }

   
    
    
    
};
module.exports = databaseConnection;