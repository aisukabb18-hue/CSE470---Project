import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";
import "./MoodLog.css";

const emotions = ["happy","sad","anxious","angry","calm","excited","depressed","neutral"];
const activityOptions = ["work","exercise","social","reading","meditation","gaming","cooking","shopping"];
const triggerOptions  = ["stress","sleep","food","weather","work","relationship","health","finance"];

const MoodLog = () => {
  const [form, setForm] = useState({
    mood: 5, emotion: "neutral", energy: 5,
    stressLevel: 5, notes: "", activities: [], triggers: [],
  });
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error,   setError]   = useState("");

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await API.get("/mood");
      setLogs(data);
    } catch (err) { console.error(err); }
  };

  const toggleItem = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(i => i !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await API.post("/mood", form);
      setSuccess("Mood logged successfully! 🌸");
      setForm({ mood: 5, emotion: "neutral", energy: 5, stressLevel: 5, notes: "", activities: [], triggers: [] });
      fetchLogs();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to log mood");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/mood/${id}`);
      fetchLogs();
    } catch (err) { console.error(err); }
  };

  const getMoodEmoji = (mood) => {
    if (mood >= 9) return "😄";
    if (mood >= 7) return "😊";
    if (mood >= 5) return "😐";
    if (mood >= 3) return "😔";
    return "😢";
  };

  return (
    <Layout title="Mood Log">
      <div className="moodlog-container">

        {/* Form */}
        <div className="moodlog-form-card">
          <h3>📝 Log Your Mood</h3>

          {success && <div className="success-msg">{success}</div>}
          {error   && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>

            {/* Mood Slider */}
            <div className="form-section">
              <label>
                Mood Level
                <span className="slider-value">
                  {getMoodEmoji(form.mood)} {form.mood}/10
                </span>
              </label>
              <input
                type="range" min="1" max="10"
                value={form.mood}
                onChange={e => setForm({ ...form, mood: Number(e.target.value) })}
                className="mood-slider"
              />
              <div className="slider-labels">
                <span>Very Bad</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Emotion */}
            <div className="form-section">
              <label>Emotion</label>
              <div className="chip-grid">
                {emotions.map(em => (
                  <button
                    key={em} type="button"
                    className={`chip ${form.emotion === em ? "chip-active" : ""}`}
                    onClick={() => setForm({ ...form, emotion: em })}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Slider */}
            <div className="form-section">
              <label>
                Energy Level
                <span className="slider-value">⚡ {form.energy}/10</span>
              </label>
              <input
                type="range" min="1" max="10"
                value={form.energy}
                onChange={e => setForm({ ...form, energy: Number(e.target.value) })}
                className="mood-slider energy-slider"
              />
            </div>

            {/* Stress Slider */}
            <div className="form-section">
              <label>
                Stress Level
                <span className="slider-value">😰 {form.stressLevel}/10</span>
              </label>
              <input
                type="range" min="1" max="10"
                value={form.stressLevel}
                onChange={e => setForm({ ...form, stressLevel: Number(e.target.value) })}
                className="mood-slider stress-slider"
              />
            </div>

            {/* Activities */}
            <div className="form-section">
              <label>Activities Today</label>
              <div className="chip-grid">
                {activityOptions.map(a => (
                  <button
                    key={a} type="button"
                    className={`chip ${form.activities.includes(a) ? "chip-active" : ""}`}
                    onClick={() => toggleItem("activities", a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Triggers */}
            <div className="form-section">
              <label>Triggers</label>
              <div className="chip-grid">
                {triggerOptions.map(t => (
                  <button
                    key={t} type="button"
                    className={`chip ${form.triggers.includes(t) ? "chip-active" : ""}`}
                    onClick={() => toggleItem("triggers", t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="form-section">
              <label>Notes</label>
              <textarea
                placeholder="How are you feeling? What's on your mind..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="mood-textarea"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Saving..." : "Log Mood 🌸"}
            </button>
          </form>
        </div>

        {/* Logs List */}
        <div className="moodlog-list">
          <h3>📋 Recent Mood Logs</h3>
          {logs.length === 0 ? (
            <div className="no-logs">No mood logs yet. Log your first mood!</div>
          ) : (
            logs.map(log => (
              <div key={log._id} className="log-card">
                <div className="log-header">
                  <div className="log-mood-emoji">
                    {getMoodEmoji(log.mood)}
                  </div>
                  <div className="log-info">
                    <p className="log-emotion">{log.emotion}</p>
                    <p className="log-date">
                      {new Date(log.date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="log-scores">
                    <span className="log-score">😊 {log.mood}/10</span>
                    <span className="log-score">⚡ {log.energy}/10</span>
                    <span className="log-score">😰 {log.stressLevel}/10</span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(log._id)}
                  >
                    🗑️
                  </button>
                </div>
                {log.notes && (
                  <p className="log-notes">"{log.notes}"</p>
                )}
                {log.activities?.length > 0 && (
                  <div className="log-tags">
                    {log.activities.map(a => (
                      <span key={a} className="log-tag">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </Layout>
  );
};

export default MoodLog;
