const express = require("express");
const { userAuthenticate, userAutherize } = require("../middleware/auth");
const { getAllUsers,getAllTaskList,deleteTask,deleteUser } = require("../controllers/adminControllers");
const router  = express.Router();

router.route("/getuserlist").get(userAuthenticate,userAutherize("admin"),getAllUsers);
router.route("/gettasklist").get(userAuthenticate,userAutherize("admin"),getAllTaskList);
router.route("/deleteuser/:id").delete(userAuthenticate,userAutherize("admin"),deleteUser);
router.route("/deletetask/:id").delete(userAuthenticate,userAutherize("admin"),deleteTask);
 

module.exports =router;