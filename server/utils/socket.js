const { Server } = require("socket.io");
const { verifyToken } = require("./token");
const { allowedOrigins } = require("../config/origins");

const parseCookies = (header = "") =>
  Object.fromEntries(
    header
      .split(";")
      .map((p) => p.trim())
      .filter((p) => p.includes("="))
      .map((p) => {
        const i = p.indexOf("=");
        return [p.slice(0, i), decodeURIComponent(p.slice(i + 1))];
      })
  );

exports.initSocket = (server, app) => {
  const io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie || "");
      const token = cookies.token || socket.handshake.auth?.token;
      if (!token) return next(new Error("unauthorized"));

      const decoded = verifyToken(token);
      socket.userId = String(decoded.userId);
      socket.userRole = decoded.userRole;
      next();
    } catch (err) {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.userId);
    if (socket.userRole === "admin") socket.join("admins");
  });

  app.set("io", io);
  return io;
};
