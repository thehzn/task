const express = require("express");
const {
  userRegister,
  userLogin,
  getMe,
  userLogout,
  getAssignableUsers,
} = require("../controllers/userControllers");
const { userAuthenticate, userAutherize } = require("../middleware/auth");
const router = express.Router();

router.route("/register").post(userRegister);
router.route("/login").post(userLogin);
router.route("/getme").get(userAuthenticate, getMe);
router.route("/logout").post(userAuthenticate, userLogout);
router
  .route("/assignable")
  .get(userAuthenticate, userAutherize("manager", "admin"), getAssignableUsers);

module.exports = router;
