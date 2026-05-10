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
        { category: "Mindfulness", title: "5-Minute Morning Meditation", duration: "5 min",  description: "Start each day with a simple breathing exercise to set a positive tone." },
        { category: "Movement",    title: "Evening Walk",                duration: "20 min", description: "A gentle walk improves mood and helps process the day's events." },
        { category: "Social",      title: "Connect with a Friend",       duration: "15 min", description: "Reach out to someone you care about — a quick text or call." },
        { category: "Gratitude",   title: "Gratitude Journaling",        duration: "5 min",  description: "Write down 3 things you're grateful for before bed." },
      ],
      moderate: [
        { category: "Breathing",   title: "Box Breathing Exercise",       duration: "10 min",   description: "Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 5 times." },
        { category: "Body",        title: "Progressive Muscle Relaxation",duration: "15 min",   description: "Systematically tense and release each muscle group." },
        { category: "Activity",    title: "30-Minute Exercise",           duration: "30 min",   description: "Any physical activity significantly reduces cortisol levels." },
        { category: "Support",     title: "Talk to Trusted Person",       duration: "Flexible", description: "Share your feelings with someone you trust." },
      ],
      high: [
        { category: "Crisis",      title: "Contact a Therapist",     duration: "ASAP",    description: "Your risk level suggests professional support would be beneficial.", urgent: true },
        { category: "Grounding",   title: "5-4-3-2-1 Grounding",    duration: "5 min",   description: "Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste." },
        { category: "Breathing",   title: "Diaphragmatic Breathing", duration: "10 min",  description: "Deep belly breathing activates the parasympathetic nervous system." },
        { category: "Sleep",       title: "Sleep Hygiene Protocol",  duration: "Ongoing", description: "No screens 1 hour before bed. Keep consistent sleep/wake times." },
      ],
      critical: [
        { category: "Crisis", title: "Immediate Support",      duration: "NOW", description: "Please contact a mental health crisis line immediately.", urgent: true, phone: "National: 988" },
        { category: "Crisis", title: "Tell Someone You Trust", duration: "NOW", description: "Do not be alone. Contact a trusted friend, family member, or therapist.", urgent: true },
        { category: "Breathing", title: "Slow Breathing",      duration: "2 min", description: "Breathe in for 4 counts, breathe out for 6 counts. Focus only on this." },
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
        ? "Your mental health metrics indicate elevated risk. Please seek support."
        : "Your risk level is currently manageable.",
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

// ─── Req 18: AI Chatbot ───────────────────────────────────────
const CHATBOT_RESPONSES = {
  greet: [
    "Hello! I am here to support you. How are you feeling today?",
    "Hi there! I am your mental wellness companion. What is on your mind?",
    "Hey! Great to see you. How has your day been going?",
  ],
  sad: [
    "I am really sorry you are feeling sad. Your feelings are completely valid. Can you tell me more about what is going on?",
    "It sounds like you are having a tough time. I am here to listen. What has been weighing on you?",
    "Sadness can feel really heavy. You do not have to carry it alone. What happened today?",
  ],
  anxious: [
    "Anxiety can feel overwhelming. Let us try something together — take a slow deep breath in for 4 counts, hold for 4, then breathe out for 4. How do you feel after that?",
    "I hear you. Anxiety is really difficult. Can you tell me what is making you feel anxious right now?",
    "When anxiety hits, grounding helps. Try naming 5 things you can see around you right now. What do you see?",
  ],
  angry: [
    "It is okay to feel angry. What happened that made you feel this way?",
    "Anger is a valid emotion. I am here to listen. Do you want to talk about what triggered this?",
    "I understand you are frustrated. Take a moment to breathe. What is going on?",
  ],
  crisis: [
    "I am very concerned about you right now. Please reach out to a crisis line immediately. In the US you can call or text 988. You matter and help is available.",
    "Your life has value and people care about you. Please contact emergency services or a trusted person right now. Crisis line: call or text 988.",
  ],
  sleep: [
    "Sleep issues can really affect your mental health. How long have you been having trouble sleeping?",
    "Poor sleep makes everything harder. Have you tried keeping a consistent sleep schedule — going to bed and waking up at the same time every day?",
    "A calming bedtime routine can help a lot. Try turning off screens an hour before bed. What does your current bedtime routine look like?",
  ],
  lonely: [
    "Feeling lonely is really painful. I am glad you reached out. Do you have anyone in your life you feel close to?",
    "Loneliness is something many people struggle with. You are not alone in feeling this way. What has been making you feel disconnected?",
  ],
  happy: [
    "That is wonderful to hear! What has been going well for you?",
    "I am so glad you are feeling good! What made today a positive day?",
    "That is great! It is important to celebrate the good moments. What are you happy about?",
  ],
  tired: [
    "Feeling tired can really drain you. Is this physical tiredness or more of an emotional exhaustion?",
    "Exhaustion is your body and mind asking for rest. When did you last have a proper break?",
    "Being tired all the time can be a sign your body needs more care. How has your sleep been lately?",
  ],
  default: [
    "I hear you. Can you tell me more about how you are feeling?",
    "Thank you for sharing that with me. How long have you been feeling this way?",
    "That sounds really difficult. Remember you are not alone in this. What would help you most right now?",
    "I appreciate you opening up. What do you think triggered these feelings?",
    "I am here for you. Would you like some coping strategies or just someone to talk to?",
  ],
};

const CRISIS_WORDS = [
  "suicide", "kill myself", "want to die", "end it all",
  "hurt myself", "self-harm", "no reason to live",
  "better off dead", "end my life", "cant go on",
];

const getBotResponse = (message, history = []) => {
  const lower = message.toLowerCase();

  if (CRISIS_WORDS.some(w => lower.includes(w))) {
    return {
      text: CHATBOT_RESPONSES.crisis[Math.floor(Math.random() * CHATBOT_RESPONSES.crisis.length)],
      crisisDetected: true,
    };
  }

  if (/hello|hi |hey|good morning|good evening|good afternoon|start/.test(lower)) {
    return {
      text: CHATBOT_RESPONSES.greet[Math.floor(Math.random() * CHATBOT_RESPONSES.greet.length)],
      crisisDetected: false,
    };
  }

  if (/happy|great|wonderful|amazing|good|better|excited|grateful|joy/.test(lower)) {
    return {
      text: CHATBOT_RESPONSES.happy[Math.floor(Math.random() * CHATBOT_RESPONSES.happy.length)],
      crisisDetected: false,
    };
  }

  if (/sad|depressed|down|unhappy|cry|miserable|hopeless|empty/.test(lower)) {
    return {
      text: CHATBOT_RESPONSES.sad[Math.floor(Math.random() * CHATBOT_RESPONSES.sad.length)],
      crisisDetected: false,
    };
  }

  if (/anxi|panic|worry|nervous|stress|overwhelm|fear|scared/.test(lower)) {
    return {
      text: CHATBOT_RESPONSES.anxious[Math.floor(Math.random() * CHATBOT_RESPONSES.anxious.length)],
      crisisDetected: false,
    };
  }

  if (/angry|anger|furious|rage|mad|frustrated|irritat/.test(lower)) {
    return {
      text: CHATBOT_RESPONSES.angry[Math.floor(Math.random() * CHATBOT_RESPONSES.angry.length)],
      crisisDetected: false,
    };
  }

  if (/sleep|insomnia|awake|cant sleep|cannot sleep/.test(lower)) {
    return {
      text: CHATBOT_RESPONSES.sleep[Math.floor(Math.random() * CHATBOT_RESPONSES.sleep.length)],
      crisisDetected: false,
    };
  }

  if (/lonely|alone|isolated|no friends|no one|nobody/.test(lower)) {
    return {
      text: CHATBOT_RESPONSES.lonely[Math.floor(Math.random() * CHATBOT_RESPONSES.lonely.length)],
      crisisDetected: false,
    };
  }

  if (/tired|exhausted|drained|fatigue|burnout|worn out/.test(lower)) {
    return {
      text: CHATBOT_RESPONSES.tired[Math.floor(Math.random() * CHATBOT_RESPONSES.tired.length)],
      crisisDetected: false,
    };
  }

  const recentBotMessages = history
    .filter(m => m.role === "assistant")
    .slice(-3)
    .map(m => m.content);

  const available = CHATBOT_RESPONSES.default.filter(
    r => !recentBotMessages.includes(r)
  );

  const pool = available.length > 0 ? available : CHATBOT_RESPONSES.default;
  return {
    text: pool[Math.floor(Math.random() * pool.length)],
    crisisDetected: false,
  };
};

// ─── Chat With Bot ────────────────────────────────────────────
exports.chatWithBot = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const sid = sessionId || uuidv4();

    const history = await ChatMessage.find({
      user: req.user.id,
      sessionId: sid,
    }).sort({ timestamp: 1 }).limit(20);

    const botResponse = getBotResponse(message, history);

    await ChatMessage.create([
      {
        user:           req.user.id,
        sessionId:      sid,
        role:           "user",
        content:        message,
        flagged:        botResponse.crisisDetected,
        crisisDetected: botResponse.crisisDetected,
      },
      {
        user:      req.user.id,
        sessionId: sid,
        role:      "assistant",
        content:   botResponse.text,
        flagged:   false,
      },
    ]);

    res.json({
      sessionId:      sid,
      reply:          botResponse.text,
      crisisDetected: botResponse.crisisDetected,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get Chat History ─────────────────────────────────────────
exports.getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await ChatMessage.find({
      user: req.user.id,
      sessionId,
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Req 19: Community Support ────────────────────────────────
exports.getCommunityResources = async (req, res) => {
  res.json({
    resources: [
      { name: "7 Cups",                url: "https://www.7cups.com",                description: "Free online chat with trained listeners" },
      { name: "Reddit r/mentalhealth", url: "https://reddit.com/r/mentalhealth",    description: "Supportive community forum" },
      { name: "NAMI",                  url: "https://www.nami.org",                 description: "National Alliance on Mental Illness" },
      { name: "Mind.org.uk",           url: "https://www.mind.org.uk",              description: "UK mental health support and advice" },
      { name: "Headspace",             url: "https://www.headspace.com",            description: "Guided meditation and mindfulness" },
    ],
    supportGroups: [
      { name: "Anxiety & Depression Community", type: "online",    members: "12K+" },
      { name: "Mindfulness Circle",             type: "virtual",   schedule: "Tuesdays 7PM" },
      { name: "Peer Support Network",           type: "in-person", schedule: "Check local listings" },
    ],
  });
};

// ─── Req 20: Recovery Progress Monitoring ────────────────────
exports.getRecoveryProgress = async (req, res) => {
  try {
    const uid   = req.user.id;
    const since = new Date(Date.now() - 30 * 86400000);
    const risk  = await RiskAssessment.find({
      user: uid,
      date: { $gte: since },
    }).sort({ date: 1 });

    const levelMap = { low: 1, moderate: 2, high: 3, critical: 4 };
    const progress = risk.map(r => ({
      date:         r.date.toISOString().split("T")[0],
      riskLevel:    r.riskLevel,
      riskScore:    r.riskScore,
      numericLevel: levelMap[r.riskLevel],
    }));

    const improving =
      progress.length > 1 &&
      progress[progress.length - 1].numericLevel <= progress[0].numericLevel;

    res.json({
      progress,
      trend:             improving ? "improving" : "needs attention",
      totalAssessments:  progress.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};