const express = require("express");
const { userRegister, userLogin, getMe, userLogout } = require("../controllers/userControllers");
const { userAuthenticate } = require("../middleware/auth");
const router = express.Router();


router.route("/register").post(userRegister);
router.route("/login").post(userLogin);
router.route("/getme").get(userAuthenticate,getMe);
router.route("/logout").post(userAuthenticate,userLogout);

module.exports = router;
