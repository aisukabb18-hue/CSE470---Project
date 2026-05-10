const express = require("express");
const router  = express.Router();
const { runRiskAssessment, getLatestRisk, getRiskHistory } = require("../controllers/riskController");
const { protect } = require("../middleware/authMiddleware");
router.use(protect);
router.post("/assess",  runRiskAssessment);
router.get ("/latest",  getLatestRisk);
router.get ("/history", getRiskHistory);
module.exports = router;