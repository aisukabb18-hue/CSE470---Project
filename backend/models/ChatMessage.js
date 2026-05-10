const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionId:  { type: String, required: true },
    role:       { type: String, enum: ["user", "assistant"], required: true },
    content:    { type: String, required: true },
    timestamp:  { type: Date, default: Date.now },
    // Metadata
    sentiment:  { type: String },
    flagged:    { type: Boolean, default: false },
    crisisDetected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ user: 1, sessionId: 1 });

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);