const mongoose = require("mongoose");

const HabitSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:       { type: String, required: true },
    category:   { type: String, enum: ["wellness","exercise","nutrition","mindfulness","social","work","sleep","other"], required: true },
    frequency:  { type: String, enum: ["daily","weekly"], default: "daily" },
    targetDays: { type: Number, default: 7 }, // days per week
    color:      { type: String, default: "#4F46E5" },
    icon:       { type: String, default: "⭐" },
    isActive:   { type: Boolean, default: true },
    completions: [
      {
        date:       { type: Date },
        completed:  { type: Boolean, default: false },
        notes:      { type: String },
      },
    ],
    // Analytics
    currentStreak:  { type: Number, default: 0 },
    longestStreak:  { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }, // percentage
  },
  { timestamps: true }
);

HabitSchema.index({ user: 1 });

module.exports = mongoose.model("Habit", HabitSchema);