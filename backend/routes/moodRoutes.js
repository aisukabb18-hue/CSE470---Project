const express = require("express");
const router  = express.Router();
const { createMoodLog, getMoodLogs, getTodaySummary, getMoodTrend, deleteMoodLog } = require("../controllers/moodController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.post  ("/",         createMoodLog);
router.get   ("/",         getMoodLogs);
router.get   ("/today",    getTodaySummary);
router.get   ("/trend",    getMoodTrend);
router.delete("/:id",      deleteMoodLog);

module.exports = router;