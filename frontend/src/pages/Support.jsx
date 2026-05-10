import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";
import "./Support.css";

const Support = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [crisisAlert,     setCrisisAlert]     = useState(null);
  const [community,       setCommunity]       = useState(null);
  const [recovery,        setRecovery]        = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [message,         setMessage]         = useState("");
  const [sessionId,       setSessionId]       = useState(null);
  const [chatLoading,     setChatLoading]     = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState("chat");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, crisisRes, commRes, recoverRes] = await Promise.all([
        API.get("/support/recommendations"),
        API.get("/support/crisis-check"),
        API.get("/support/community"),
        API.get("/support/recovery"),
      ]);
      setRecommendations(recRes.data);
      setCrisisAlert(crisisRes.data);
      setCommunity(commRes.data);
      setRecovery(recoverRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMsg = { role: "user", content: message };
    setMessages(prev => [...prev, userMsg]);
    setMessage("");
    setChatLoading(true);
    try {
      const { data } = await API.post("/support/chat", {
        message,
        sessionId,
      });
      setSessionId(data.sessionId);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      if (data.crisisDetected) {
        setMessages(prev => [
          ...prev,
          {
            role: "system",
            content:
              "⚠️ Crisis keywords detected. Please reach out to a mental health professional immediately. Call/Text 988.",
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const tabs = [
    { id: "chat",            label: "💬 AI Chat"     },
    { id: "recommendations", label: "💡 Coping Tips" },
    { id: "community",       label: "👥 Community"   },
    { id: "recovery",        label: "📈 Recovery"    },
  ];

  if (loading) {
    return (
      <Layout title="Support">
        <div className="loading">Loading support resources... 💚</div>
      </Layout>
    );
  }

  return (
    <Layout title="Support">
      <div className="support-container">

        {crisisAlert?.alert && (
          <div className="crisis-banner">
            <p>⚠️ {crisisAlert.message}</p>
            {crisisAlert.resources?.map((r, i) => (
              <p key={i} className="crisis-resource">
                📞 {r.name}: {r.contact}
              </p>
            ))}
          </div>
        )}

        <div className="support-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`support-tab ${activeTab === tab.id ? "tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "chat" && (
          <div className="chat-container">
            <div className="chat-header">
              <div className="chat-avatar">🤖</div>
              <div>
                <p className="chat-name">MindCare AI</p>
                <p className="chat-status">● Online — here to support you</p>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-welcome">
                  <p>👋 Hi! I am your mental wellness companion.</p>
                  <p>How are you feeling today?</p>
                  <div className="chat-suggestions">
                    {[
                      "I am feeling anxious",
                      "I cannot sleep",
                      "I feel sad",
                      "Hello!",
                    ].map(s => (
                      <button
                        key={s}
                        className="suggestion-btn"
                        onClick={() => setMessage(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message ${
                    msg.role === "user"
                      ? "message-user"
                      : msg.role === "assistant"
                      ? "message-bot"
                      : "message-system"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="message-avatar">🤖</div>
                  )}
                  <div className="message-bubble">{msg.content}</div>
                  {msg.role === "user" && (
                    <div className="message-avatar user-avatar-chat">😊</div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="message message-bot">
                  <div className="message-avatar">🤖</div>
                  <div className="message-bubble typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-row">
              <textarea
                className="chat-input"
                placeholder="Type your message... (Enter to send)"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={2}
              />
              <button
                className="chat-send-btn"
                onClick={sendMessage}
                disabled={chatLoading || !message.trim()}
              >
                Send 💬
              </button>
            </div>
          </div>
        )}

        {activeTab === "recommendations" && recommendations && (
          <div className="recommendations-container">
            <div className="rec-header">
              <h3>💡 Personalized Coping Strategies</h3>
              <span
                className="risk-badge-sm"
                style={{
                  background:
                    recommendations.riskLevel === "low"
                      ? "#86efac"
                      : recommendations.riskLevel === "moderate"
                      ? "#fde68a"
                      : recommendations.riskLevel === "high"
                      ? "#fca5a5"
                      : "#f87171",
                }}
              >
                {recommendations.riskLevel?.toUpperCase()} RISK
              </span>
            </div>
            <div className="rec-grid">
              {recommendations.recommendations?.map((rec, i) => (
                <div
                  key={i}
                  className={`rec-card ${rec.urgent ? "rec-urgent" : ""}`}
                >
                  <div className="rec-card-header">
                    <span className="rec-category">{rec.category}</span>
                    <span className="rec-duration">⏱️ {rec.duration}</span>
                  </div>
                  <p className="rec-title">{rec.title}</p>
                  <p className="rec-desc">{rec.description}</p>
                  {rec.phone && (
                    <p className="rec-phone">📞 {rec.phone}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "community" && community && (
          <div className="community-container">
            <h3>🌍 Mental Health Resources</h3>
            <div className="community-grid">
              {community.resources?.map((r, i) => {
                const openLink = () => window.open(r.url, "_blank");
                return (
                  <div
                    key={i}
                    onClick={openLink}
                    className="community-card"
                    style={{ cursor: "pointer" }}
                  >
                    <p className="community-name">{r.name}</p>
                    <p className="community-desc">{r.description}</p>
                    <span className="community-link">Visit →</span>
                  </div>
                );
              })}
            </div>

            <h3 className="section-title">👥 Support Groups</h3>
            <div className="groups-grid">
              {community.supportGroups?.map((g, i) => {
                return (
                  <div key={i} className="group-card">
                    <p className="group-name">{g.name}</p>
                    <div className="group-meta">
                      <span className="group-type">{g.type}</span>
                      {g.members && (
                        <span className="group-members">
                          👥 {g.members}
                        </span>
                      )}
                      {g.schedule && (
                        <span className="group-schedule">
                          🕐 {g.schedule}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "recovery" && (
          <div className="recovery-container">
            <h3>📈 Recovery Progress</h3>
            {recovery?.progress?.length > 0 ? (
              <div>
                <div
                  className="recovery-trend"
                  style={{
                    background:
                      recovery.trend === "improving"
                        ? "#dcfce7"
                        : "#fef9c3",
                  }}
                >
                  <p>
                    {recovery.trend === "improving" ? "✅" : "⚠️"} Trend:{" "}
                    {recovery.trend}
                  </p>
                  <p>Total Assessments: {recovery.totalAssessments}</p>
                </div>
                <div className="recovery-timeline">
                  {recovery.progress.map((p, i) => {
                    return (
                      <div key={i} className="timeline-item">
                        <div
                          className="timeline-dot"
                          style={{
                            background:
                              p.riskLevel === "low"
                                ? "#86efac"
                                : p.riskLevel === "moderate"
                                ? "#fde68a"
                                : p.riskLevel === "high"
                                ? "#fca5a5"
                                : "#f87171",
                          }}
                        />
                        <div className="timeline-content">
                          <p className="timeline-date">{p.date}</p>
                          <p className="timeline-level">
                            {p.riskLevel?.toUpperCase()}
                          </p>
                          <p className="timeline-score">
                            Score: {p.riskScore}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="no-data">
                No recovery data yet. Run a risk assessment first!
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Support;