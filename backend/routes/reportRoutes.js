const express = require("express");
const router  = express.Router();
const {
  getWeeklyReport,
  getMoodPerformanceCorrelation,
  exportData,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/weekly",      getWeeklyReport);
router.get("/correlation", getMoodPerformanceCorrelation);
router.get("/export",      exportData);

module.exports = router;