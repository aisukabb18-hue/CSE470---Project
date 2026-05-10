const ChatMessage    = require("../models/ChatMessage");
const RiskAssessment = require("../models/RiskAssessment");
const { v4: uuidv4 } = require("uuid");

// ─── Req 16: Personalized Coping Recommendations ─────────────
exports.getCopingRecommendations = async (req, res) => {
  try {
    const risk = await RiskAssessment.findOne({ user: req.user.id }).sort({ date: -1 });
    const level = risk?.riskLevel || "low";

    const recommendations = {
      low: [
        { category: "Mindfulness", title: "5-Minute Morning Meditation", duration: "5 min", description: "Start each day with a simple breathing exercise to set a positive tone." },
        { category: "Movement",    title: "Evening Walk",               duration: "20 min", description: "A gentle walk improves mood and helps process the day's events." },
        { category: "Social",      title: "Connect with a Friend",      duration: "15 min", description: "Reach out to someone you care about — a quick text or call." },
        { category: "Gratitude",   title: "Gratitude Journaling",       duration: "5 min",  description: "Write down 3 things you're grateful for before bed." },
      ],
      moderate: [
        { category: "Breathing",   title: "Box Breathing Exercise",  duration: "10 min", description: "Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 5 times." },
        { category: "Body",        title: "Progressive Muscle Relaxation", duration: "15 min", description: "Systematically tense and release each muscle group." },
        { category: "Activity",    title: "30-Minute Exercise",       duration: "30 min", description: "Any physical activity significantly reduces cortisol levels." },
        { category: "Support",     title: "Talk to Trusted Person",   duration: "Flexible", description: "Share your feelings with someone you trust." },
      ],
      high: [
        { category: "Crisis",      title: "Contact a Therapist",      duration: "ASAP", description: "Your risk level suggests professional support would be beneficial.", urgent: true },
        { category: "Grounding",   title: "5-4-3-2-1 Grounding",     duration: "5 min", description: "Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste." },
        { category: "Breathing",   title: "Diaphragmatic Breathing",  duration: "10 min", description: "Deep belly breathing activates the parasympathetic nervous system." },
        { category: "Sleep",       title: "Sleep Hygiene Protocol",   duration: "Ongoing", description: "No screens 1 hour before bed. Keep consistent sleep/wake times." },
      ],
      critical: [
        { category: "Crisis",      title: "🆘 Immediate Support",     duration: "NOW", description: "Please contact a mental health crisis line immediately.", urgent: true, phone: "National: 988" },
        { category: "Crisis",      title: "Tell Someone You Trust",   duration: "NOW", description: "Don't be alone. Contact a trusted friend, family member, or therapist.", urgent: true },
        { category: "Breathing",   title: "Slow Breathing",           duration: "2 min", description: "Breathe in for 4 counts, breathe out for 6 counts. Focus only on this." },
      ],
    };

    res.json({ riskLevel: level, recommendations: recommendations[level] || recommendations.low });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Req 17: Crisis Risk Alert System ────────────────────────
exports.checkCrisisAlert = async (req, res) => {
  try {
    const risk = await RiskAssessment.findOne({ user: req.user.id }).sort({ date: -1 });
    const isCrisis = risk && (risk.riskLevel === "critical" || risk.riskLevel === "high");

    res.json({
      alert: isCrisis,
      level: risk?.riskLevel || "low",
      message: isCrisis
        ? "⚠️ Your mental health metrics indicate elevated risk. Please seek support."
        : "✅ Your risk level is currently manageable.",
      resources: isCrisis ? [
        { name: "Crisis Text Line",     contact: "Text HOME to 741741" },
        { name: "Suicide Hotline (US)", contact: "Call/Text 988" },
        { name: "International Assoc.", contact: "https://www.iasp.info/resources/Crisis_Centres/" },
      ] : [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Req 18: AI Chatbot Integration ──────────────────────────
// Simple rule-based + keyword response chatbot (no external API needed)
const CHATBOT_RESPONSES = {
  greet: ["Hello! I'm here to support you. How are you feeling today?", "Hi there! I'm your mental wellness companion. What's on your mind?"],
  sad:   ["I'm sorry you're feeling sad. It's okay to feel this way. Can you tell me more about what's going on?", "Your feelings are valid. Would you like some coping strategies that might help?"],
  anxious: ["Anxiety can feel overwhelming. Try taking 3 slow deep breaths with me. Breathe in... hold... breathe out. Better?", "Let's try to ground ourselves. Name 5 things you can see around you right now."],
  crisis:  ["I'm very concerned about you. Please reach out to a crisis line right now. In the US: call or text 988. You matter and help is available.", "Your life has value. Please contact emergency services or a trusted person immediately."],
  sleep:   ["Sleep issues affect mental health significantly. Have you tried keeping a consistent sleep schedule?", "A calming bedtime routine can help — try reducing screen time 1 hour before bed."],
  default: ["I hear you. Tell me more about how you're feeling.", "Thank you for sharing that. How long have you been feeling this way?", "That sounds difficult. Remember, you're not alone in this."],
};

const CRISIS_WORDS = ["suicide","kill myself","want to die","end it all","hurt myself","self-harm","no reason to live"];

const getBotResponse = (message) => {
  const lower = message.toLowerCase();
  if (CRISIS_WORDS.some(w => lower.includes(w))) return { text: CHATBOT_RESPONSES.crisis[0], crisisDetected: true };
  if (/hello|hi|hey|start/.test(lower)) return { text: CHATBOT_RESPONSES.greet[Math.floor(Math.random()*2)], crisisDetected: false };
  if (/sad|depressed|down|unhappy|cry/.test(lower)) return { text: CHATBOT_RESPONSES.sad[Math.floor(Math.random()*2)], crisisDetected: false };
  if (/anxious|anxiety|panic|worry|nervous|stress/.test(lower)) return { text: CHATBOT_RESPONSES.anxious[Math.floor(Math.random()*2)], crisisDetected: false };
  if (/sleep|insomnia|tired|rest/.test(lower)) return { text: CHATBOT_RESPONSES.sleep[Math.floor(Math.random()*2)], crisisDetected: false };
  const arr = CHATBOT_RESPONSES.default;
  return { text: arr[Math.floor(Math.random()*arr.length)], crisisDetected: false };
};

exports.chatWithBot = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const sid = sessionId || uuidv4();
    const botResponse = getBotResponse(message);

    // Save both messages to DB
    await ChatMessage.create([
      { user: req.user.id, sessionId: sid, role: "user",      content: message,          flagged: botResponse.crisisDetected, crisisDetected: botResponse.crisisDetected },
      { user: req.user.id, sessionId: sid, role: "assistant", content: botResponse.text, flagged: false },
    ]);

    res.json({ sessionId: sid, reply: botResponse.text, crisisDetected: botResponse.crisisDetected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await ChatMessage.find({ user: req.user.id, sessionId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Req 19: Community Support ────────────────────────────────
// (Simplified — returns community resources)
exports.getCommunityResources = async (req, res) => {
  res.json({
    resources: [
      { name: "7 Cups",           url: "https://www.7cups.com",            description: "Free online chat with trained listeners" },
      { name: "Reddit r/mentalhealth", url: "https://reddit.com/r/mentalhealth", description: "Supportive community forum" },
      { name: "NAMI",             url: "https://www.nami.org",             description: "National Alliance on Mental Illness" },
      { name: "Mind.org.uk",      url: "https://www.mind.org.uk",          description: "UK mental health support and advice" },
      { name: "Headspace",        url: "https://www.headspace.com",        description: "Guided meditation and mindfulness" },
    ],
    supportGroups: [
      { name: "Anxiety & Depression Community", type: "online",   members: "12K+" },
      { name: "Mindfulness Circle",             type: "virtual",  schedule: "Tuesdays 7PM" },
      { name: "Peer Support Network",           type: "in-person",schedule: "Check local listings" },
    ],
  });
};

// ─── Req 20: Recovery Progress Monitoring ────────────────────
exports.getRecoveryProgress = async (req, res) => {
  try {
    const uid   = req.user.id;
    const since = new Date(Date.now() - 30 * 86400000);
    const risk  = await RiskAssessment.find({ user: uid, date: { $gte: since } }).sort({ date: 1 });

    const levelMap = { low: 1, moderate: 2, high: 3, critical: 4 };
    const progress = risk.map(r => ({
      date:      r.date.toISOString().split("T")[0],
      riskLevel: r.riskLevel,
      riskScore: r.riskScore,
      numericLevel: levelMap[r.riskLevel],
    }));

    const improving = progress.length > 1 && progress[progress.length-1].numericLevel <= progress[0].numericLevel;
    res.json({ progress, trend: improving ? "improving" : "needs attention", totalAssessments: progress.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};