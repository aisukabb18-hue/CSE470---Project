const express = require("express");
const router  = express.Router();
const {
  getBehavioralAnalytics, getTherapistPanel, getProductivityCorrelation,
  detectAnomalies, getAdminDashboard
} = require("../controllers/adminController");
const { protect, adminOnly, therapistOrAdmin } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/behavioral",        therapistOrAdmin, getBehavioralAnalytics);
router.get("/therapist",         therapistOrAdmin, getTherapistPanel);
router.get("/productivity",      therapistOrAdmin, getProductivityCorrelation);
router.get("/anomalies/:userId", therapistOrAdmin, detectAnomalies);
router.get("/anomalies",         protect,          detectAnomalies);
router.get("/dashboard",         adminOnly,        getAdminDashboard);
module.exports = router;