const express  =require("express");
const { userAuthenticate, userAutherize } = require("../middleware/auth");
const { createTaskbyUser,createTaskbymanager,getAllforUser,getAllformanager,getTask,updateTaskbyUser,updateTaskbymanager,deleteTask } = require("../controllers/taskControllers");
const router = express.Router();


router.route("/create").post(userAuthenticate,createTaskbyUser);
router.route("/createbymanager").post(userAuthenticate,userAutherize("manager"),createTaskbymanager);
router.route("/getall").get(userAuthenticate,getAllforUser);
router.route("/getallformanager").get(userAuthenticate,userAutherize("manager"),getAllformanager);
router.route("/get/:id").get(userAuthenticate,getTask);
router.route("/update/:id").put(userAuthenticate,updateTaskbyUser);
router.route("/updatebymanager/:id").put(userAuthenticate,userAutherize("manager"),updateTaskbymanager);
router.route("/delete/:id").delete(userAuthenticate,deleteTask);



module.exports= router;