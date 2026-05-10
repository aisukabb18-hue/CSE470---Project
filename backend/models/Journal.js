const mongoose = require("mongoose");

const JournalSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title:   { type: String, required: true },
    content: { type: String, required: true }, // will be stored encrypted
    mood:    { type: Number, min: 1, max: 10 },
    date:    { type: Date, default: Date.now },
    tags:    [{ type: String }],
    // AI Analysis Results
    sentimentScore:  { type: Number },     // -1 (very negative) to 1 (very positive)
    sentimentLabel:  { type: String, enum: ["very_negative","negative","neutral","positive","very_positive"] },
    keyThemes:       [{ type: String }],   // extracted topics
    emotionDetected: [{ type: String }],   // emotions found in text
    riskKeywords:    [{ type: String }],   // flagged words
    aiSummary:       { type: String },     // AI-generated summary
    isPrivate:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

JournalSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("Journal", JournalSchema);