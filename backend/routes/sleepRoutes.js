const express = require("express");
const router  = express.Router();
const { logSleep, getSleepLogs, getSleepAnalytics } = require("../controllers/sleepController");
const { protect } = require("../middleware/authMiddleware");
router.use(protect);
router.post("/",          logSleep);
router.get ("/",          getSleepLogs);
router.get ("/analytics", getSleepAnalytics);
module.exports = router;