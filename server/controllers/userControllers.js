const User = require("../models/userSchema");
const { generateToken } = require("../utils/token");
const { getCookieOpts, getClearCookieOpts } = require("../utils/cookie");


const safeUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  age: u.age,
  role: u.role,
});


const tokenInBody = (token) =>
  process.env.RETURN_TOKEN_IN_BODY === "true" ? { token } : {};

exports.userRegister = async (req, res) => {
  try {
    const { name, email, password, age, role } = req.body;

    if (!name || !email || !password || !age) {
      return res.status(400).json({ success: false, message: "Enter full details" });
    }
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Invalid details" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }


    const safeRole = ["user", "manager"].includes(role) ? role : "user";

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      age,
      role: safeRole,
    });

    const token = await generateToken(user._id, user.role);

    return res
      .status(201)
      .cookie("token", token, getCookieOpts())
      .json({
        success: true,
        message: "User registered successfully",
        user: safeUser(user),
        ...tokenInBody(token),
      });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(", "),
      });
    }
    console.error("register error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Enter full details" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");


    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = await generateToken(user._id, user.role);

    return res
      .status(200)
      .cookie("token", token, getCookieOpts())
      .json({
        success: true,
        message: "User logged in successfully",
        user: safeUser(user),
        ...tokenInBody(token),
      });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.userLogout = (req, res) => {
  return res
    .status(200)
    .clearCookie("token", getClearCookieOpts())
    .json({ success: true, message: "User logged out successfully" });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.getAssignableUsers = async (req, res) => {
  try {
    const roles = req.userRole === "admin" ? ["user", "manager"] : ["user"];
    const users = await User.find({ role: { $in: roles } })
      .select("name email role")
      .sort({ name: 1 })
      .limit(200);
    return res.json({ success: true, users });
  } catch (error) {
    console.error("getAssignableUsers error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
