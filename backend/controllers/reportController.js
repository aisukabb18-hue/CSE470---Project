const MoodLog        = require("../models/MoodLog");
const SleepLog       = require("../models/SleepLog");
const Journal        = require("../models/Journal");
const RiskAssessment = require("../models/RiskAssessment");
const Habit          = require("../models/Habit");
const { decrypt }    = require("../utils/encryption");

// ─── Weekly Report ────────────────────────────────────────────
exports.getWeeklyReport = async (req, res) => {
  try {
    const uid   = req.user.id;
    const since = new Date(Date.now() - 7 * 86400000);

    const [moodLogs, sleepLogs, journals, habits] = await Promise.all([
      MoodLog.find({ user: uid, date: { $gte: since } }).sort({ date: 1 }),
      SleepLog.find({ user: uid, date: { $gte: since } }).sort({ date: 1 }),
      Journal.find({ user: uid, date: { $gte: since } }).sort({ date: 1 }),
      Habit.find({ user: uid, isActive: true }),
    ]);

    const avgMood    = moodLogs.length ? moodLogs.reduce((s, l) => s + l.mood, 0) / moodLogs.length : null;
    const avgSleep   = sleepLogs.length ? sleepLogs.reduce((s, l) => s + l.duration, 0) / sleepLogs.length : null;
    const avgStress  = moodLogs.length ? moodLogs.reduce((s, l) => s + (l.stressLevel || 0), 0) / moodLogs.length : null;
    const avgHabitCompletion = habits.length ? habits.reduce((s, h) => s + (h.completionRate || 0), 0) / habits.length : null;

    const emotionBreakdown = {};
    moodLogs.forEach(l => {
      emotionBreakdown[l.emotion] = (emotionBreakdown[l.emotion] || 0) + 1;
    });

    const dailySummary = {};
    moodLogs.forEach(l => {
      const day = l.date.toISOString().split("T")[0];
      if (!dailySummary[day]) dailySummary[day] = { moods: [], stress: [] };
      dailySummary[day].moods.push(l.mood);
      if (l.stressLevel) dailySummary[day].stress.push(l.stressLevel);
    });

    const daily = Object.entries(dailySummary).map(([date, d]) => ({
      date,
      avgMood:   Math.round(d.moods.reduce((a, b) => a + b, 0) / d.moods.length * 10) / 10,
      avgStress: d.stress.length ? Math.round(d.stress.reduce((a, b) => a + b, 0) / d.stress.length * 10) / 10 : null,
    }));

    res.json({
      period: { from: since, to: new Date() },
      summary: {
        avgMood:            avgMood    ? Math.round(avgMood * 10) / 10    : null,
        avgSleep:           avgSleep   ? Math.round(avgSleep * 10) / 10   : null,
        avgStress:          avgStress  ? Math.round(avgStress * 10) / 10  : null,
        avgHabitCompletion: avgHabitCompletion ? Math.round(avgHabitCompletion) : null,
        totalMoodLogs:      moodLogs.length,
        totalJournals:      journals.length,
        totalSleepLogs:     sleepLogs.length,
      },
      emotionBreakdown,
      daily,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Mood Performance Correlation ─────────────────────────────
exports.getMoodPerformanceCorrelation = async (req, res) => {
  try {
    const uid   = req.user.id;
    const since = new Date(Date.now() - 30 * 86400000);

    const [moodLogs, sleepLogs] = await Promise.all([
      MoodLog.find({ user: uid, date: { $gte: since } }).sort({ date: 1 }),
      SleepLog.find({ user: uid, date: { $gte: since } }).sort({ date: 1 }),
    ]);

    // Map sleep by date
    const sleepByDate = {};
    sleepLogs.forEach(l => {
      const day = l.date.toISOString().split("T")[0];
      sleepByDate[day] = l.duration;
    });

    // Correlate mood with sleep
    const correlation = moodLogs.map(l => {
      const day = l.date.toISOString().split("T")[0];
      return {
        date:        day,
        mood:        l.mood,
        stressLevel: l.stressLevel,
        sleepHours:  sleepByDate[day] || null,
        emotion:     l.emotion,
      };
    });

    // High sleep vs low sleep mood average
    const highSleep = correlation.filter(d => d.sleepHours >= 7);
    const lowSleep  = correlation.filter(d => d.sleepHours !== null && d.sleepHours < 7);

    const avgMoodHighSleep = highSleep.length ? highSleep.reduce((s, d) => s + d.mood, 0) / highSleep.length : null;
    const avgMoodLowSleep  = lowSleep.length  ? lowSleep.reduce((s, d) => s + d.mood, 0)  / lowSleep.length  : null;

    res.json({
      correlation,
      insights: {
        avgMoodWithGoodSleep: avgMoodHighSleep ? Math.round(avgMoodHighSleep * 10) / 10 : null,
        avgMoodWithPoorSleep: avgMoodLowSleep  ? Math.round(avgMoodLowSleep  * 10) / 10 : null,
        sleepMoodImpact: avgMoodHighSleep && avgMoodLowSleep
          ? Math.round((avgMoodHighSleep - avgMoodLowSleep) * 10) / 10
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Export Data ──────────────────────────────────────────────
exports.exportData = async (req, res) => {
  try {
    const uid = req.user.id;

    const [moodLogs, sleepLogs, journals, habits, riskHistory] = await Promise.all([
      MoodLog.find({ user: uid }).sort({ date: -1 }).limit(100),
      SleepLog.find({ user: uid }).sort({ date: -1 }).limit(100),
      Journal.find({ user: uid }).sort({ date: -1 }).limit(50),
      Habit.find({ user: uid }),
      RiskAssessment.find({ user: uid }).sort({ date: -1 }).limit(30),
    ]);

    // Decrypt journal content and mood notes
    const decryptedJournals = journals.map(j => ({
      ...j.toObject(),
      content: decrypt(j.content),
    }));

    const decryptedMoods = moodLogs.map(l => ({
      ...l.toObject(),
      notes: l.notes ? decrypt(l.notes) : "",
    }));

    res.json({
      exportDate: new Date(),
      userId:     uid,
      data: {
        moodLogs:      decryptedMoods,
        sleepLogs,
        journals:      decryptedJournals,
        habits,
        riskAssessments: riskHistory,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};