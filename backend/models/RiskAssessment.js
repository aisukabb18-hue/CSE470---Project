const mongoose = require("mongoose");

const RiskAssessmentSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date:     { type: Date, default: Date.now },

    // ── Stress Index (Req 6) ─────────────────────────────────
    stressIndex: { type: Number, min: 0, max: 100 }, // composite score
    stressFactors: [{ factor: String, weight: Number }],

    // ── Burnout Detection (Req 7) ─────────────────────────────
    burnoutScore:   { type: Number, min: 0, max: 100 },
    burnoutStage:   { type: String, enum: ["none","mild","moderate","severe"] },
    burnoutIndicators: [{ type: String }],

    // ── Risk Level Classification (Req 8) ────────────────────
    riskLevel:  { type: String, enum: ["low","moderate","high","critical"], default: "low" },
    riskScore:  { type: Number, min: 0, max: 100 },

    // ── Trigger Pattern Detection (Req 9) ────────────────────
    triggers: [
      {
        type:       { type: String },
        frequency:  { type: Number },
        moodImpact: { type: Number },
        lastSeen:   { type: Date },
      },
    ],

    // ── Risk Prediction Forecasting (Req 10) ─────────────────
    predictedRiskNextWeek: { type: String, enum: ["low","moderate","high","critical"] },
    forecastConfidence:    { type: Number }, // 0-100%
    recommendedActions:    [{ type: String }],

    // ── Alert sent? ───────────────────────────────────────────
    alertSent: { type: Boolean, default: false },
    alertType: { type: String },
  },
  { timestamps: true }
);

RiskAssessmentSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("RiskAssessment", RiskAssessmentSchema);