// ── journalRoutes.js ───────────────────────────────────────────
const express = require("express");
const j = express.Router();
const { createJournal, getJournals, getJournal, updateJournal, deleteJournal } = require("../controllers/journalController");
const { protect } = require("../middleware/authMiddleware");
j.use(protect);
j.post  ("/",    createJournal);
j.get   ("/",    getJournals);
j.get   ("/:id", getJournal);
j.put   ("/:id", updateJournal);
j.delete("/:id", deleteJournal);
module.exports = j;