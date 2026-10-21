const dotenv = require("dotenv");
dotenv.config({path:"./config/config.env"});

const app = require("./app");

const databaseConnection = require("./config/databaseConnection");

databaseConnection();

app.listen(process.env.PORT,()=>{
    console.log(`server is running on port ${process.env.PORT}`);
    
});