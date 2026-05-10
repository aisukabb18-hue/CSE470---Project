const SleepLog = require("../models/SleepLog");

// ─── Calculate sleep duration in hours ───────────────────────
const calcDuration = (bedtime, wakeTime) => {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bed  = bh * 60 + bm;
  let wake = wh * 60 + wm;
  if (wake < bed) wake += 1440; // next day
  return Math.round(((wake - bed) / 60) * 10) / 10;
};

// ─── Calculate sleep score (0–100) ───────────────────────────
const calcSleepScore = (duration, quality, interrupted) => {
  let score = 100;
  // Duration penalty
  if (duration < 6) score -= 30;
  else if (duration < 7) score -= 15;
  else if (duration > 9) score -= 10;
  // Quality bonus/penalty
  score += (quality - 3) * 8; // quality 1-5 around median 3
  // Interruption penalty
  if (interrupted) score -= 15;
  return Math.max(0, Math.min(100, Math.round(score)));
};

// ─── Req 3: Log Sleep ─────────────────────────────────────────
exports.logSleep = async (req, res) => {
  try {
    const { bedtime, wakeTime, quality, interrupted, interruptionCount, notes, date } = req.body;
    const duration  = calcDuration(bedtime, wakeTime);
    const sleepDebt = Math.max(0, 8 - duration);
    const sleepScore = calcSleepScore(duration, quality, interrupted);

    const log = await SleepLog.create({
      user: req.user.id, bedtime, wakeTime, quality,
      interrupted, interruptionCount, notes,
      duration, sleepDebt, sleepScore,
      date: date || Date.now(),
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get Sleep Logs ───────────────────────────────────────────
exports.getSleepLogs = async (req, res) => {
  try {
    const logs = await SleepLog.find({ user: req.user.id }).sort({ date: -1 }).limit(30);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Sleep Analytics ──────────────────────────────────────────
exports.getSleepAnalytics = async (req, res) => {
  try {
    const days  = parseInt(req.query.days) || 14;
    const since = new Date(Date.now() - days * 86400000);
    const logs  = await SleepLog.find({ user: req.user.id, date: { $gte: since } }).sort({ date: 1 });

    if (!logs.length) return res.json({ message: "No data", analytics: {} });

    const avgDuration  = logs.reduce((s, l) => s + l.duration, 0) / logs.length;
    const avgQuality   = logs.reduce((s, l) => s + (l.quality || 3), 0) / logs.length;
    const avgScore     = logs.reduce((s, l) => s + (l.sleepScore || 50), 0) / logs.length;
    const totalDebt    = logs.reduce((s, l) => s + (l.sleepDebt || 0), 0);
    const trend        = avgDuration >= 7 ? "improving" : avgDuration >= 6 ? "stable" : "declining";

    // Weekly breakdown
    const weekly = logs.map(l => ({
      date:      l.date.toISOString().split("T")[0],
      duration:  l.duration,
      quality:   l.quality,
      sleepScore: l.sleepScore,
    }));

    res.json({
      avgDuration:  Math.round(avgDuration * 10) / 10,
      avgQuality:   Math.round(avgQuality * 10) / 10,
      avgScore:     Math.round(avgScore),
      totalSleepDebt: Math.round(totalDebt * 10) / 10,
      trend, weekly,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};