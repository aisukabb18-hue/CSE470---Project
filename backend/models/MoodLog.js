const mongoose = require("mongoose");

const MoodLogSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mood:       { type: Number, min: 1, max: 10, required: true }, // 1=very bad, 10=excellent
    emotion:    { type: String, enum: ["happy","sad","anxious","angry","calm","excited","depressed","neutral"], required: true },
    energy:     { type: Number, min: 1, max: 10 },
    activities: [{ type: String }], // e.g. ["work","exercise","social"]
    notes:      { type: String, default: "" }, // encrypted on the fly in controller
    triggers:   [{ type: String }],
    date:       { type: Date, default: Date.now },
    stressLevel:{ type: Number, min: 1, max: 10 },
    // AI-generated fields
    sentimentScore:  { type: Number }, // -1 to 1
    riskFlag:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for fast date-range queries per user
MoodLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("MoodLog", MoodLogSchema);