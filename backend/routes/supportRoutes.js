const express = require("express");
const router  = express.Router();
const {
  getCopingRecommendations, checkCrisisAlert, chatWithBot, getChatHistory,
  getCommunityResources, getRecoveryProgress
} = require("../controllers/supportController");
const { protect } = require("../middleware/authMiddleware");
router.use(protect);
router.get ("/recommendations",    getCopingRecommendations);
router.get ("/crisis-check",       checkCrisisAlert);
router.post("/chat",               chatWithBot);
router.get ("/chat/:sessionId",    getChatHistory);
router.get ("/community",          getCommunityResources);
router.get ("/recovery",           getRecoveryProgress);
module.exports = router;