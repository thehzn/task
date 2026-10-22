const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    poster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "in progress", "completed"],
      default: "pending",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    duedate: { type: Date, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  },
  { timestamps: true } 
);


taskSchema.index({ assignedTo: 1, createdAt: -1 });
taskSchema.index({ poster: 1, createdAt: -1 });

module.exports = mongoose.model("Tasks", taskSchema);
