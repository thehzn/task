const idOf = (v) => String(v && v._id ? v._id : v);

const emitToRooms = (req, rooms, event, payload) => {
  const io = req.app.get("io");
  if (!io) return;
  io.to([...new Set(rooms.map(String))]).emit(event, payload);
};

const emitTaskEvent = (req, event, task) => {
  const payload = typeof task.toJSON === "function" ? task.toJSON() : task;
  emitToRooms(req, ["admins", idOf(task.poster), idOf(task.assignedTo)], event, payload);
};

module.exports = { emitToRooms, emitTaskEvent };
