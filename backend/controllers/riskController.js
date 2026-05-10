const RiskAssessment = require("../models/RiskAssessment");
const MoodLog        = require("../models/MoodLog");
const SleepLog       = require("../models/SleepLog");
const Habit          = require("../models/Habit");

// ─── Req 6: Calculate Stress Index ───────────────────────────
const calcStressIndex = (moodAvg, sleepAvg, habitCompletion, stressAvg) => {
  let score = 0;
  if (moodAvg < 4)        score += 30;
  else if (moodAvg < 6)   score += 15;
  if (sleepAvg < 6)       score += 25;
  else if (sleepAvg < 7)  score += 10;
  if (habitCompletion < 40) score += 20;
  else if (habitCompletion < 60) score += 10;
  if (stressAvg > 7)      score += 25;
  else if (stressAvg > 5) score += 10;
  return Math.min(100, score);
};

// ─── Req 7: Burnout Detection ─────────────────────────────────
const detectBurnout = (stressIndex, moodTrend, sleepDebt) => {
  let score = stressIndex * 0.5;
  if (sleepDebt > 10) score += 20;
  if (moodTrend === "declining") score += 20;
  score = Math.min(100, score);
  const stage = score > 75 ? "severe" : score > 50 ? "moderate" : score > 25 ? "mild" : "none";
  const indicators = [];
  if (stressIndex > 60) indicators.push("Persistently high stress");
  if (sleepDebt > 10)   indicators.push("Significant sleep debt");
  if (moodTrend === "declining") indicators.push("Declining mood trend");
  return { burnoutScore: Math.round(score), burnoutStage: stage, burnoutIndicators: indicators };
};

// ─── Req 8: Risk Level Classification ────────────────────────
const classifyRisk = (stressIndex, burnoutScore, riskFlags, sentimentAvg) => {
  let score = (stressIndex * 0.3) + (burnoutScore * 0.3) + (riskFlags * 10) + (Math.abs(sentimentAvg) * 20);
  score = Math.min(100, score);
  const level = score > 75 ? "critical" : score > 50 ? "high" : score > 25 ? "moderate" : "low";
  return { riskScore: Math.round(score), riskLevel: level };
};

// ─── Req 9: Trigger Pattern Detection ────────────────────────
const detectTriggers = (moodLogs) => {
  const triggerMap = {};
  moodLogs.forEach(log => {
    (log.triggers || []).forEach(t => {
      if (!triggerMap[t]) triggerMap[t] = { count: 0, moodTotal: 0 };
      triggerMap[t].count++;
      triggerMap[t].moodTotal += log.mood;
    });
  });
  return Object.entries(triggerMap)
    .filter(([, v]) => v.count > 0)
    .map(([type, v]) => ({
      type,
      frequency:  v.count,
      moodImpact: Math.round((v.moodTotal / v.count) * 10) / 10,
      lastSeen:   new Date(),
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
};

// ─── Req 10: Risk Forecasting ─────────────────────────────────
const forecastRisk = (riskHistory) => {
  if (riskHistory.length < 3) return { predictedRiskNextWeek: "moderate", forecastConfidence: 40 };
  const levels = { low: 1, moderate: 2, high: 3, critical: 4 };
  const scores = riskHistory.slice(-7).map(r => levels[r.riskLevel] || 1);
  const avg    = scores.reduce((a, b) => a + b, 0) / scores.length;
  const trend  = scores[scores.length - 1] > scores[0] ? 1 : -1;
  const predicted = Math.min(4, Math.max(1, Math.round(avg + trend * 0.5)));
  const map = ["low","moderate","high","critical"];
  return { predictedRiskNextWeek: map[predicted - 1], forecastConfidence: 60 + Math.min(30, riskHistory.length * 3) };
};

// ─── Main Risk Assessment Endpoint ───────────────────────────
exports.runRiskAssessment = async (req, res) => {
  try {
    const uid   = req.user.id;
    const since = new Date(Date.now() - 7 * 86400000);

    const [moodLogs, sleepLogs, habits, riskHistory] = await Promise.all([
      MoodLog.find({ user: uid, date: { $gte: since } }),
      SleepLog.find({ user: uid, date: { $gte: since } }),
      Habit.find({ user: uid, isActive: true }),
      RiskAssessment.find({ user: uid }).sort({ date: -1 }).limit(14),
    ]);

    const moodAvg  = moodLogs.length  ? moodLogs.reduce((s, l) => s + l.mood, 0) / moodLogs.length : 5;
    const stressAvg= moodLogs.length  ? moodLogs.reduce((s, l) => s + (l.stressLevel || 5), 0) / moodLogs.length : 5;
    const sleepAvg = sleepLogs.length ? sleepLogs.reduce((s, l) => s + l.duration, 0) / sleepLogs.length : 7;
    const sleepDebt= sleepLogs.reduce((s, l) => s + (l.sleepDebt || 0), 0);
    const sentimentAvg = moodLogs.length ? moodLogs.reduce((s,l)=>s+(l.sentimentScore||0),0)/moodLogs.length : 0;
    const riskFlags    = moodLogs.filter(l => l.riskFlag).length;

    const habitsTotal = habits.reduce((s, h) => s + (h.completionRate || 0), 0);
    const habitCompletion = habits.length ? habitsTotal / habits.length : 50;

    const moodTrend = moodLogs.length > 3
      ? (moodLogs.slice(-3).reduce((s,l)=>s+l.mood,0)/3 >= moodAvg ? "stable" : "declining")
      : "stable";

    const stressIndex = calcStressIndex(moodAvg, sleepAvg, habitCompletion, stressAvg);
    const burnout     = detectBurnout(stressIndex, moodTrend, sleepDebt);
    const { riskScore, riskLevel } = classifyRisk(stressIndex, burnout.burnoutScore, riskFlags, sentimentAvg);
    const triggers    = detectTriggers(moodLogs);
    const forecast    = forecastRisk(riskHistory);
    const alertSent   = riskLevel === "critical" || riskLevel === "high";

    // Personalized recommendations
    const recommendedActions = [];
    if (sleepAvg < 7) recommendedActions.push("Aim for 7-8 hours of sleep nightly");
    if (stressIndex > 60) recommendedActions.push("Practice 10 minutes of deep breathing daily");
    if (moodAvg < 5) recommendedActions.push("Schedule one enjoyable activity each day");
    if (habitCompletion < 50) recommendedActions.push("Focus on completing at least 3 core habits daily");
    recommendedActions.push("Consider speaking with a mental health professional");

    const assessment = await RiskAssessment.create({
      user: uid, stressIndex, ...burnout, riskScore, riskLevel,
      triggers, ...forecast, recommendedActions, alertSent,
      alertType: alertSent ? `${riskLevel.toUpperCase()} risk detected` : null,
    });

    res.json(assessment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get Latest Assessment ────────────────────────────────────
exports.getLatestRisk = async (req, res) => {
  try {
    const assessment = await RiskAssessment.findOne({ user: req.user.id }).sort({ date: -1 });
    res.json(assessment || { riskLevel: "low", riskScore: 0, message: "No assessment yet" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get Risk History ─────────────────────────────────────────
exports.getRiskHistory = async (req, res) => {
  try {
    const history = await RiskAssessment.find({ user: req.user.id }).sort({ date: -1 }).limit(30);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};