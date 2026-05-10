const MoodLog = require("../models/MoodLog");
const { encrypt, decrypt } = require("../utils/encryption");

// ─── Simple Sentiment Analysis (keyword-based) ────────────────
const analyzeSentiment = (notes = "", emotion = "", mood = 5) => {
  const positive = ["happy","great","wonderful","amazing","joy","excited","love","calm","peaceful","good","better","excellent"];
  const negative = ["sad","anxious","angry","depressed","awful","terrible","hate","fear","pain","bad","worse","hopeless","suicidal","worthless"];
  const text = (notes + " " + emotion).toLowerCase();
  let score = (mood - 5) / 5; // base score from -1 to 1
  positive.forEach(w => { if (text.includes(w)) score = Math.min(1, score + 0.1); });
  negative.forEach(w => { if (text.includes(w)) score = Math.max(-1, score - 0.15); });
  return Math.round(score * 100) / 100;
};

// ─── Req 1: Create Mood Log ───────────────────────────────────
exports.createMoodLog = async (req, res) => {
  try {
    const { mood, emotion, energy, activities, notes, triggers, stressLevel, date } = req.body;
    const sentimentScore = analyzeSentiment(notes, emotion, mood);
    const riskFlag = sentimentScore < -0.5 || mood <= 3;

    const log = await MoodLog.create({
      user: req.user.id,
      mood, emotion, energy, activities, triggers, stressLevel,
      notes: notes ? encrypt(notes) : "",
      sentimentScore,
      riskFlag,
      date: date || Date.now(),
    });
    res.status(201).json({ ...log.toObject(), notes: notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get All Mood Logs for User ───────────────────────────────
exports.getMoodLogs = async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    const filter = { user: req.user.id };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }
    const logs = await MoodLog.find(filter).sort({ date: -1 }).limit(Number(limit));
    const decrypted = logs.map(l => ({
      ...l.toObject(),
      notes: l.notes ? decrypt(l.notes) : "",
    }));
    res.json(decrypted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get Today's Mood Summary ─────────────────────────────────
exports.getTodaySummary = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    const logs = await MoodLog.find({ user: req.user.id, date: { $gte: start, $lte: end } });
    const avg  = logs.length ? logs.reduce((s, l) => s + l.mood, 0) / logs.length : null;
    const decrypted = logs.map(l => ({
      ...l.toObject(),
      notes: l.notes ? decrypt(l.notes) : "",
    }));
    res.json({ count: decrypted.length, averageMood: avg, logs: decrypted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Req 11/12: Mood Trend & Heatmap Data ────────────────────
exports.getMoodTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await MoodLog.find({ user: req.user.id, date: { $gte: since } }).sort({ date: 1 });

    // Group by day for chart
    const grouped = {};
    logs.forEach(log => {
      const day = log.date.toISOString().split("T")[0];
      if (!grouped[day]) grouped[day] = { moods: [], stress: [], sentiment: [] };
      grouped[day].moods.push(log.mood);
      if (log.stressLevel) grouped[day].stress.push(log.stressLevel);
      if (log.sentimentScore !== undefined) grouped[day].sentiment.push(log.sentimentScore);
    });

    const trend = Object.entries(grouped).map(([date, d]) => ({
      date,
      avgMood:      Math.round((d.moods.reduce((a,b)=>a+b,0)/d.moods.length)*10)/10,
      avgStress:    d.stress.length ? Math.round((d.stress.reduce((a,b)=>a+b,0)/d.stress.length)*10)/10 : null,
      avgSentiment: d.sentiment.length ? Math.round((d.sentiment.reduce((a,b)=>a+b,0)/d.sentiment.length)*100)/100 : null,
    }));

    res.json(trend);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Delete Mood Log ──────────────────────────────────────────
exports.deleteMoodLog = async (req, res) => {
  try {
    const log = await MoodLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!log) return res.status(404).json({ message: "Log not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};