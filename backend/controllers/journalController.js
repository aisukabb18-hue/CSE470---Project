const Journal = require("../models/Journal");
const { encrypt, decrypt } = require("../utils/encryption");

// ─── Sentiment Analysis Engine ────────────────────────────────
const POSITIVE_WORDS = ["happy","joy","grateful","love","peaceful","excited","hope","calm","inspired","wonderful","amazing","blessed","content","proud","motivated"];
const NEGATIVE_WORDS = ["sad","anxious","depressed","angry","hopeless","worthless","tired","overwhelmed","afraid","lonely","pain","cry","hurt","exhausted","empty"];
const RISK_KEYWORDS  = ["suicide","self-harm","end my life","want to die","can't go on","no reason to live","give up","cut myself","hurt myself"];
const EMOTION_MAP    = { joy:1,happy:1,love:1,excited:1,grateful:1,sad:-1,angry:-1,fear:-1,disgust:-1,anxious:-1 };

const analyzeJournal = (text = "") => {
  const lower = text.toLowerCase();
  let score = 0;
  const emotions = [], themes = [], riskKws = [];

  POSITIVE_WORDS.forEach(w => { if (lower.includes(w)) { score += 0.1; emotions.push(w); } });
  NEGATIVE_WORDS.forEach(w => { if (lower.includes(w)) { score -= 0.12; emotions.push(w); } });
  RISK_KEYWORDS.forEach(w  => { if (lower.includes(w)) riskKws.push(w); });

  score = Math.max(-1, Math.min(1, score));

  let label = "neutral";
  if (score >  0.4) label = "very_positive";
  else if (score >  0.1) label = "positive";
  else if (score < -0.4) label = "very_negative";
  else if (score < -0.1) label = "negative";

  return { sentimentScore: Math.round(score * 100) / 100, sentimentLabel: label,
           emotionDetected: [...new Set(emotions)].slice(0, 5),
           riskKeywords: riskKws, keyThemes: [] };
};

// ─── Req 2: Create Journal Entry ─────────────────────────────
exports.createJournal = async (req, res) => {
  try {
    const { title, content, mood, tags, date } = req.body;
    const analysis = analyzeJournal(content);
    const encryptedContent = encrypt(content);

    const journal = await Journal.create({
      user: req.user.id, title, mood, tags,
      content: encryptedContent,
      date: date || Date.now(),
      ...analysis,
    });
    res.status(201).json({ ...journal.toObject(), content }); // return plain content to client
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get All Journals ─────────────────────────────────────────
exports.getJournals = async (req, res) => {
  try {
    const journals = await Journal.find({ user: req.user.id }).sort({ date: -1 }).limit(50);
    const result = journals.map(j => ({ ...j.toObject(), content: decrypt(j.content) }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get Single Journal ───────────────────────────────────────
exports.getJournal = async (req, res) => {
  try {
    const j = await Journal.findOne({ _id: req.params.id, user: req.user.id });
    if (!j) return res.status(404).json({ message: "Not found" });
    res.json({ ...j.toObject(), content: decrypt(j.content) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Update Journal ───────────────────────────────────────────
exports.updateJournal = async (req, res) => {
  try {
    const { title, content, mood, tags } = req.body;
    const analysis = content ? analyzeJournal(content) : {};
    const update = { title, mood, tags, ...analysis };
    if (content) update.content = encrypt(content);

    const j = await Journal.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, update, { new: true });
    if (!j) return res.status(404).json({ message: "Not found" });
    res.json({ ...j.toObject(), content: content || decrypt(j.content) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Delete Journal ───────────────────────────────────────────
exports.deleteJournal = async (req, res) => {
  try {
    const j = await Journal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!j) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};