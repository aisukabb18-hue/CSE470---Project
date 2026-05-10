const express = require("express");
const router  = express.Router();
const { createHabit, getHabits, logHabitCompletion } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
router.use(protect);
router.post("/",          createHabit);
router.get ("/",          getHabits);
router.post("/completion",logHabitCompletion);
module.exports = router;