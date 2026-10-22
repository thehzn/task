const User = require("../models/userSchema");
const Tasks = require("../models/taskSchema");
const {
  STATUSES,
  parsePage,
  isValidId,
  buildTaskFilter,
  buildSort,
  handleError,
} = require("../utils/helpers");
const { notifyAssigned, notifyUpdated } = require("../utils/sendMail");
const { emitToRooms, emitTaskEvent } = require("../utils/socketEvents");

const POPULATE = [
  { path: "poster", select: "name email" },
  { path: "assignedTo", select: "name email" },
];

const idOf = (v) => String(v && v._id ? v._id : v);

const canAssign = (actorRole, actorId, assignee) => {
  if (String(assignee._id) === String(actorId)) return true;
  if (actorRole === "admin") return ["user", "manager"].includes(assignee.role);
  if (actorRole === "manager") return assignee.role === "user";
  return false;
};

// create tak

exports.createTaskbyUser = async (req, res) => {
  try {
    const { title, description, duedate, priority, status } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const created = await Tasks.create({
      poster: req.userId,
      title,
      description,
      duedate,
      priority,
      status,
      assignedTo: req.userId,
    });
    const task = await created.populate(POPULATE);

    emitTaskEvent(req, "task:created", task);
    return res.status(201).json({ success: true, message: "Task created successfully", newtask: task });
  } catch (error) {
    return handleError(res, error, "createTaskbyUser");
  }
};

exports.createTaskbymanager = async (req, res) => {
  try {
    const { title, description, duedate, priority, status, assignedTo } = req.body;

    if (!isValidId(assignedTo)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid assignedTo user id is required" });
    }

    const [user, assignee] = await Promise.all([
      User.findById(req.userId),
      User.findById(assignedTo),
    ]);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!assignee) {
      return res.status(404).json({ success: false, message: "Assignee not found" });
    }
    if (!canAssign(req.userRole, req.userId, assignee)) {
      return res.status(403).json({
        success: false,
        message: "You cannot assign tasks to a user with this role",
      });
    }

    const created = await Tasks.create({
      poster: req.userId,
      title,
      description,
      duedate,
      priority,
      status,
      assignedTo,
    });
    const task = await created.populate(POPULATE);

    emitTaskEvent(req, "task:created", task);
    notifyAssigned(task); // fire and forget - not awaited on purpose

    return res.status(201).json({
      success: true,
      message: "Task created and assigned to user successfully",
      newtask: task,
    });
  } catch (error) {
    return handleError(res, error, "createTaskbymanager");
  }
};


const listTasks = async (req, res, baseFilter, label) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const { filter, error } = buildTaskFilter(req.query);
    if (error) return res.status(400).json({ success: false, message: error });

    const query = { ...filter, ...baseFilter };

    const [tasks, total] = await Promise.all([
      Tasks.find(query).populate(POPULATE).sort(buildSort(req.query)).skip(skip).limit(limit),
      Tasks.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "tasks fetched successfully",
      count: tasks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: tasks,
    });
  } catch (error) {
    return handleError(res, error, label);
  }
};


exports.getAllforUser = (req, res) =>
  listTasks(req, res, { assignedTo: req.userId }, "getAllforUser");

exports.getAllformanager = (req, res) => {
  const base = { poster: req.userId };
  if (req.query.assignedTo !== undefined) {
    if (!isValidId(req.query.assignedTo)) {
      return res.status(400).json({ success: false, message: "Invalid assignedTo filter" });
    }
    base.assignedTo = req.query.assignedTo;
  }
  return listTasks(req, res, base, "getAllformanager");
};

exports.getTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid task id" });
    }

    const task = await Tasks.findById(id).populate(POPULATE);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }


    const isPoster = idOf(task.poster) === req.userId;
    const isAssignee = idOf(task.assignedTo) === req.userId;
    if (!isPoster && !isAssignee && req.userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to access this task" });
    }

    return res.status(200).json({ success: true, message: "Details fetched successfully", task });
  } catch (error) {
    return handleError(res, error, "getTask");
  }
};

//update by  manager
exports.updateTaskbymanager = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid task id" });
    }

    const task = await Tasks.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (String(task.poster) !== req.userId) {
      return res.status(403).json({ success: false, message: "Not authorized to update this task" });
    }

    const body = req.body || {};
    const updates = {};
    for (const f of ["title", "description", "duedate", "priority", "status"]) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    const oldAssignee = String(task.assignedTo);
    let reassigned = false;
    if (body.assignedTo !== undefined && String(body.assignedTo) !== oldAssignee) {
      if (!isValidId(body.assignedTo)) {
        return res.status(400).json({ success: false, message: "Invalid assignedTo user id" });
      }
      const assignee = await User.findById(body.assignedTo);
      if (!assignee) {
        return res.status(404).json({ success: false, message: "Assignee not found" });
      }
      if (!canAssign(req.userRole, req.userId, assignee)) {
        return res.status(403).json({
          success: false,
          message: "You cannot assign tasks to a user with this role",
        });
      }
      updates.assignedTo = body.assignedTo;
      reassigned = true;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }
    if (updates.status !== undefined && !STATUSES.includes(updates.status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const updated = await Tasks.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate(POPULATE);

    emitTaskEvent(req, "task:updated", updated);

    if (reassigned) {
   
      emitToRooms(req, [oldAssignee], "task:deleted", { _id: id });
      notifyAssigned(updated);
    } else if (idOf(updated.assignedTo) !== req.userId) {
      notifyUpdated(updated, updated.assignedTo, updated.poster.name);
    }

    return res.status(200).json({ success: true, message: "task updated successfully", task: updated });
  } catch (error) {
    return handleError(res, error, "updateTaskbymanager");
  }
};


exports.updateTaskbyUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid task id" });
    }

    const task = await Tasks.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (String(task.assignedTo) !== req.userId) {
      return res.status(403).json({ success: false, message: "Not authorized to update this task" });
    }

    const body = req.body || {};
    const updates = {};
    if (body.status !== undefined) updates.status = body.status;

    const isSelfPosted = String(task.poster) === req.userId;
    if (isSelfPosted) {
      for (const f of ["title", "description", "duedate", "priority"]) {
        if (body[f] !== undefined) updates[f] = body[f];
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }
    if (updates.status !== undefined && !STATUSES.includes(updates.status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const updated = await Tasks.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate(POPULATE);

    emitTaskEvent(req, "task:updated", updated);


    if (!isSelfPosted) {
      notifyUpdated(updated, updated.poster, updated.assignedTo.name);
    }

    return res.status(200).json({ success: true, message: "task updated successfully", task: updated });
  } catch (error) {
    return handleError(res, error, "updateTaskbyUser");
  }
};

//delete

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
    if (String(task.poster) !== req.userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this task" });
    }

    await task.deleteOne();
    emitTaskEvent(req, "task:deleted", {
      _id: id,
      poster: String(task.poster),
      assignedTo: String(task.assignedTo),
    });

    return res.status(200).json({ success: true, message: "task deleted successfully" });
  } catch (error) {
    return handleError(res, error, "deleteTask");
  }
};


