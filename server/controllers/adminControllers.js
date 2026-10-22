const User = require("../models/userSchema");
const Tasks = require("../models/taskSchema");
const {
  parsePage,
  escapeRegex,
  isValidId,
  buildTaskFilter,
  buildSort,
  handleError,
} = require("../utils/helpers");
const { emitTaskEvent } = require("../utils/socketEvents");

exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const { role, search } = req.query;

    const filter = { role: { $ne: "admin" } };
    if (typeof role === "string" && ["user", "manager"].includes(role)) {
      filter.role = role;
    }
    if (typeof search === "string" && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select("name email role age createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      totalUsers: total, 
      page,
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    return handleError(res, error, "getAllUsers");
  }
};

exports.getAllTaskList = async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const { filter, error } = buildTaskFilter(req.query);
    if (error) return res.status(400).json({ success: false, message: error });

    for (const key of ["assignedTo", "poster"]) {
      if (req.query[key] !== undefined) {
        if (!isValidId(req.query[key])) {
          return res.status(400).json({ success: false, message: `Invalid ${key} filter` });
        }
        filter[key] = req.query[key];
      }
    }

    const [tasklist, total] = await Promise.all([
      Tasks.find(filter)
        .populate("poster", "name email")
        .populate("assignedTo", "name email")
        .sort(buildSort(req.query))
        .skip(skip)
        .limit(limit),
      Tasks.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "tasks list fetched successfully",
      total,
      page,
      pages: Math.ceil(total / limit),
      tasklist,
    });
  } catch (error) {
    return handleError(res, error, "getAllTaskList");
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    if (id === req.userId) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Admin accounts cannot be deleted" });
    }

    const tasks = await Tasks.find({ $or: [{ poster: id }, { assignedTo: id }] })
      .select("_id poster assignedTo")
      .lean();
    await Tasks.deleteMany({ _id: { $in: tasks.map((t) => t._id) } });
    await user.deleteOne();

  
    tasks.forEach((t) =>
      emitTaskEvent(req, "task:deleted", {
        _id: String(t._id),
        poster: String(t.poster),
        assignedTo: String(t.assignedTo),
      })
    );

    return res.json({
      success: true,
      message: "User deleted successfully",
      deletedTasks: tasks.length,
    });
  } catch (error) {
    return handleError(res, error, "deleteUser");
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid task id" });
    }

    const task = await Tasks.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await task.deleteOne();
    emitTaskEvent(req, "task:deleted", {
      _id: id,
      poster: String(task.poster),
      assignedTo: String(task.assignedTo),
    });

    return res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    return handleError(res, error, "deleteTask");
  }
};
