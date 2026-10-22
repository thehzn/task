const STATUSES = ["pending", "in progress", "completed"];
const PRIORITIES = ["low", "medium", "high"];


const parsePage = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


const isValidId = (id) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);


const str = (v) => (typeof v === "string" ? v.trim() : undefined);


const buildTaskFilter = (query) => {
  const filter = {};
  const status = str(query.status);
  const priority = str(query.priority);
  const search = str(query.search);
  const dueFrom = str(query.dueFrom);
  const dueTo = str(query.dueTo);

  if (status) {
    if (!STATUSES.includes(status)) return { error: "Invalid status filter" };
    filter.status = status;
  }
  if (priority) {
    if (!PRIORITIES.includes(priority)) return { error: "Invalid priority filter" };
    filter.priority = priority;
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: rx }, { description: rx }];
  }
  if (dueFrom || dueTo) {
    filter.duedate = {};
    if (dueFrom) {
      const d = new Date(dueFrom);
      if (isNaN(d)) return { error: "Invalid dueFrom date" };
      filter.duedate.$gte = d;
    }
    if (dueTo) {
      const d = new Date(dueTo);
      if (isNaN(d)) return { error: "Invalid dueTo date" };
      filter.duedate.$lte = d;
    }
  }
  return { filter };
};


const buildSort = (query) => {
  const field = ["createdAt", "duedate", "updatedAt"].includes(query.sortBy)
    ? query.sortBy
    : "createdAt";
  const dir = query.order === "asc" ? 1 : -1;
  return { [field]: dir, _id: -1 };
};

const handleError = (res, error, label = "Request") => {
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(error.errors).map((e) => e.message).join(", "),
    });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: `Invalid value for ${error.path}` });
  }
  console.error(`${label} error:`, error);
  return res.status(500).json({ success: false, message: "Server error" });
};

module.exports = {
  STATUSES,
  PRIORITIES,
  parsePage,
  escapeRegex,
  isValidId,
  buildTaskFilter,
  buildSort,
  handleError,
};
