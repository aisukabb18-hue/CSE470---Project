const mongoose = require("mongoose");

const SleepLogSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date:       { type: Date, default: Date.now },
    bedtime:    { type: String, required: true },   // "23:30"
    wakeTime:   { type: String, required: true },   // "07:00"
    duration:   { type: Number, required: true },   // hours (calculated)
    quality:    { type: Number, min: 1, max: 5 },   // 1=very poor, 5=excellent
    interrupted:{ type: Boolean, default: false },
    interruptionCount: { type: Number, default: 0 },
    notes:      { type: String },
    // Analytics fields
    sleepDebt:  { type: Number },   // hours below recommended (8hrs)
    sleepScore: { type: Number },   // 0-100 calculated score
    trend:      { type: String, enum: ["improving","stable","declining"] },
  },
  { timestamps: true }
);

SleepLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("SleepLog", SleepLogSchema);