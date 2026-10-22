const express = require("express");
const { userAuthenticate, userAutherize } = require("../middleware/auth");
const {
  createTaskbyUser,
  createTaskbymanager,
  getAllforUser,
  getAllformanager,
  getTask,
  updateTaskbyUser,
  updateTaskbymanager,
  deleteTask,
} = require("../controllers/taskControllers");
const router = express.Router();


router.route("/create").post(userAuthenticate, createTaskbyUser);
router.route("/getall").get(userAuthenticate, getAllforUser);
router.route("/update/:id").put(userAuthenticate, updateTaskbyUser);


const managerOrAdmin = userAutherize("manager", "admin");
router.route("/createbymanager").post(userAuthenticate, managerOrAdmin, createTaskbymanager);
router.route("/getallformanager").get(userAuthenticate, managerOrAdmin, getAllformanager);
router.route("/updatebymanager/:id").put(userAuthenticate, managerOrAdmin, updateTaskbymanager);

router.route("/get/:id").get(userAuthenticate, getTask);
router.route("/delete/:id").delete(userAuthenticate, deleteTask);

module.exports = router;
