const User           = require("../models/User");
const MoodLog        = require("../models/MoodLog");
const SleepLog       = require("../models/SleepLog");
const RiskAssessment = require("../models/RiskAssessment");
const Habit          = require("../models/Habit");

// ─── Req 21: Behavioral Analytics Dashboard ───────────────────
exports.getBehavioralAnalytics = async (req, res) => {
  try {
    const totalUsers   = await User.countDocuments({ role: "user" });
    const activeToday  = await MoodLog.distinct("user", { date: { $gte: new Date(Date.now() - 86400000) } });
    const totalMoods   = await MoodLog.countDocuments();
    const avgMoodPipeline = [{ $group: { _id: null, avg: { $avg: "$mood" }, avgStress: { $avg: "$stressLevel" } } }];
    const [avgData]    = await MoodLog.aggregate(avgMoodPipeline);

    // Mood distribution across all users
    const moodDist = await MoodLog.aggregate([
      { $group: { _id: "$emotion", count: { $sum: 1 } } },
      { $sort:  { count: -1 } }
    ]);

    // Risk level distribution
    const riskDist = await RiskAssessment.aggregate([
      { $sort:  { date: -1 } },
      { $group: { _id: "$user", latestRisk: { $first: "$riskLevel" } } },
      { $group: { _id: "$latestRisk", count: { $sum: 1 } } }
    ]);

    res.json({
      overview: {
        totalUsers,
        activeToday:    activeToday.length,
        totalMoodLogs:  totalMoods,
        avgMood:        avgData ? Math.round(avgData.avg * 10) / 10 : null,
        avgStress:      avgData ? Math.round(avgData.avgStress * 10) / 10 : null,
      },
      moodDistribution:  moodDist,
      riskDistribution:  riskDist,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Req 22: Therapist Analytics Panel ───────────────────────
exports.getTherapistPanel = async (req, res) => {
  try {
    // Get all users assigned to this therapist (or all if admin)
    const filter = req.user.role === "admin" ? { role: "user" } : { therapistId: req.user.id };
    const patients = await User.find(filter).select("-password").limit(50);

    const patientData = await Promise.all(
      patients.map(async (p) => {
        const [latestMood, latestRisk, moodCount] = await Promise.all([
          MoodLog.findOne({ user: p._id }).sort({ date: -1 }),
          RiskAssessment.findOne({ user: p._id }).sort({ date: -1 }),
          MoodLog.countDocuments({ user: p._id, date: { $gte: new Date(Date.now() - 7*86400000) } }),
        ]);
        return {
          patientId:    p._id,
          name:         p.name,
          email:        p.email,
          lastActivity: latestMood?.date || p.updatedAt,
          currentMood:  latestMood?.mood || "No data",
          riskLevel:    latestRisk?.riskLevel || "unknown",
          logsThisWeek: moodCount,
          alertFlag:    latestRisk?.riskLevel === "high" || latestRisk?.riskLevel === "critical",
        };
      })
    );

    res.json({
      totalPatients: patients.length,
      highRiskCount: patientData.filter(p => p.alertFlag).length,
      patients: patientData.sort((a, b) => (b.alertFlag ? 1 : 0) - (a.alertFlag ? 1 : 0)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Req 23: Productivity Correlation Analysis ────────────────
exports.getProductivityCorrelation = async (req, res) => {
  try {
    const moodLogs = await MoodLog.find({}).select("mood stressLevel activities date").limit(1000).lean();
    const productivityData = moodLogs.reduce((acc, log) => {
      const hasWork = (log.activities || []).some(a => ["work","study","exercise"].includes(a));
      const category = hasWork ? "productive" : "non-productive";
      if (!acc[category]) acc[category] = { moods: [], stress: [] };
      acc[category].moods.push(log.mood);
      if (log.stressLevel) acc[category].stress.push(log.stressLevel);
      return acc;
    }, {});

    const result = Object.entries(productivityData).map(([cat, d]) => ({
      category:  cat,
      avgMood:   Math.round(d.moods.reduce((a,b)=>a+b,0)/d.moods.length * 10)/10,
      avgStress: d.stress.length ? Math.round(d.stress.reduce((a,b)=>a+b,0)/d.stress.length*10)/10 : null,
      samples:   d.moods.length,
    }));

    res.json({ correlation: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Req 24: Anomaly Detection Model ─────────────────────────
exports.detectAnomalies = async (req, res) => {
  try {
    const uid = req.params.userId || req.user.id;
    const since = new Date(Date.now() - 30 * 86400000);
    const moodLogs = await MoodLog.find({ user: uid, date: { $gte: since } }).sort({ date: 1 });

    if (moodLogs.length < 5) return res.json({ anomalies: [], message: "Need at least 5 logs" });

    const moods = moodLogs.map(l => l.mood);
    const mean  = moods.reduce((a,b)=>a+b,0) / moods.length;
    const std   = Math.sqrt(moods.reduce((s,m)=>s+(m-mean)**2,0)/moods.length);

    const anomalies = moodLogs
      .filter(l => Math.abs(l.mood - mean) > 2 * std)
      .map(l => ({
        date:   l.date,
        mood:   l.mood,
        emotion: l.emotion,
        deviation: Math.round(Math.abs(l.mood - mean) * 10) / 10,
        type:   l.mood < mean ? "unusually_low" : "unusually_high",
      }));

    res.json({ anomalies, mean: Math.round(mean*10)/10, std: Math.round(std*10)/10, totalLogs: moodLogs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Req 25: Administrative Analytics Dashboard ───────────────
exports.getAdminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalMoods, totalSleep, totalRisk] = await Promise.all([
      User.countDocuments(),
      MoodLog.countDocuments(),
      SleepLog.countDocuments(),
      RiskAssessment.countDocuments(),
    ]);

    const criticalUsers = await RiskAssessment.aggregate([
      { $sort:  { date: -1 } },
      { $group: { _id: "$user", level: { $first: "$riskLevel" }, date: { $first: "$date" } } },
      { $match: { level: { $in: ["critical","high"] } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { "user.name":1, "user.email":1, level:1, date:1 } },
      { $limit: 20 },
    ]);

    const recentActivity = await MoodLog.aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 }, avgMood: { $avg: "$mood" } } },
      { $sort: { _id: -1 } },
      { $limit: 7 },
    ]);

    res.json({
      totals:          { users: totalUsers, moodLogs: totalMoods, sleepLogs: totalSleep, riskAssessments: totalRisk },
      criticalAlerts:  criticalUsers,
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Habit Controller also here for simplicity ───────────────
const Habit2 = require("../models/Habit");

exports.createHabit = async (req, res) => {
  try {
    const { name, category, frequency, targetDays, color, icon } = req.body;
    const habit = await Habit2.create({ user: req.user.id, name, category, frequency, targetDays, color, icon });
    res.status(201).json(habit);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit2.find({ user: req.user.id, isActive: true });
    res.json(habits);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.logHabitCompletion = async (req, res) => {
  try {
    const { habitId, date, completed, notes } = req.body;
    const habit = await Habit2.findOne({ _id: habitId, user: req.user.id });
    if (!habit) return res.status(404).json({ message: "Habit not found" });

    habit.completions.push({ date: date || new Date(), completed, notes });

    // Recalculate completion rate
    const last30 = habit.completions.slice(-30);
    habit.completionRate = Math.round(last30.filter(c => c.completed).length / last30.length * 100);

    // Streak calculation
    habit.currentStreak = completed ? habit.currentStreak + 1 : 0;
    if (habit.currentStreak > habit.longestStreak) habit.longestStreak = habit.currentStreak;

    await habit.save();
    res.json(habit);
  } catch (err) { res.status(500).json({ message: err.message }); }
};