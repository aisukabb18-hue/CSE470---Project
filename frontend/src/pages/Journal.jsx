import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";
import "./Journal.css";

const Journal = () => {
  const [form, setForm]       = useState({ title: "", content: "", mood: 5, tags: "" });
  const [journals, setJournals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState("");
  const [error,    setError]    = useState("");

  useEffect(() => { fetchJournals(); }, []);

  const fetchJournals = async () => {
    try {
      const { data } = await API.get("/journal");
      setJournals(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      };
      await API.post("/journal", payload);
      setSuccess("Journal entry saved! 📔");
      setForm({ title: "", content: "", mood: 5, tags: "" });
      fetchJournals();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save journal");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/journal/${id}`);
      setSelected(null);
      fetchJournals();
    } catch (err) { console.error(err); }
  };

  const getSentimentColor = (label) => {
    const colors = {
      very_positive: "#86efac",
      positive:      "#bbf7d0",
      neutral:       "#e2e8f0",
      negative:      "#fecaca",
      very_negative: "#fca5a5",
    };
    return colors[label] || "#e2e8f0";
  };

  const getSentimentEmoji = (label) => {
    const emojis = {
      very_positive: "😄",
      positive:      "🙂",
      neutral:       "😐",
      negative:      "😔",
      very_negative: "😢",
    };
    return emojis[label] || "😐";
  };

  return (
    <Layout title="Journal">
      <div className="journal-container">

        {/* Left — Form + List */}
        <div className="journal-left">

          {/* Write Entry */}
          <div className="journal-card">
            <h3>✍️ New Journal Entry</h3>

            {success && <div className="success-msg">{success}</div>}
            {error   && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="Give your entry a title..."
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  className="journal-input"
                />
              </div>

              <div className="form-section">
                <label>
                  Mood
                  <span className="slider-value">😊 {form.mood}/10</span>
                </label>
                <input
                  type="range" min="1" max="10"
                  value={form.mood}
                  onChange={e => setForm({ ...form, mood: Number(e.target.value) })}
                  className="mood-slider"
                />
              </div>

              <div className="form-section">
                <label>Write Your Thoughts</label>
                <textarea
                  placeholder="What's on your mind today? How are you feeling? Write freely..."
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={6}
                  required
                  className="journal-textarea"
                />
              </div>

              <div className="form-section">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. gratitude, work, family"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="journal-input"
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Saving..." : "Save Entry 📔"}
              </button>
            </form>
          </div>

          {/* Journal List */}
          <div className="journal-card">
            <h3>📚 Past Entries ({journals.length})</h3>
            {journals.length === 0 ? (
              <div className="no-data">No journal entries yet. Write your first one!</div>
            ) : (
              journals.map(j => (
                <div
                  key={j._id}
                  className={`journal-list-item ${selected?._id === j._id ? "journal-list-active" : ""}`}
                  onClick={() => setSelected(j)}
                >
                  <div className="journal-list-header">
                    <p className="journal-list-title">{j.title}</p>
                    <span
                      className="sentiment-badge"
                      style={{ background: getSentimentColor(j.sentimentLabel) }}
                    >
                      {getSentimentEmoji(j.sentimentLabel)} {j.sentimentLabel?.replace("_", " ")}
                    </span>
                  </div>
                  <p className="journal-list-date">
                    {new Date(j.date).toLocaleDateString("en-US", {
                      month: "long", day: "numeric", year: "numeric"
                    })}
                  </p>
                  <p className="journal-list-preview">
                    {j.content?.slice(0, 80)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right — Selected Entry */}
        <div className="journal-right">
          {selected ? (
            <div className="journal-card journal-detail">
              <div className="journal-detail-header">
                <h3>{selected.title}</h3>
                <button
                  className="delete-btn-red"
                  onClick={() => handleDelete(selected._id)}
                >
                  🗑️ Delete
                </button>
              </div>

              <div className="journal-meta">
                <span>📅 {new Date(selected.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                <span>😊 Mood: {selected.mood}/10</span>
                <span
                  className="sentiment-badge"
                  style={{ background: getSentimentColor(selected.sentimentLabel) }}
                >
                  {getSentimentEmoji(selected.sentimentLabel)} {selected.sentimentLabel?.replace("_", " ")}
                </span>
              </div>

              <div className="journal-content">
                {selected.content}
              </div>

              {selected.emotionDetected?.length > 0 && (
                <div className="journal-analysis">
                  <p className="analysis-title">🤖 AI Detected Emotions</p>
                  <div className="tag-row">
                    {selected.emotionDetected.map(e => (
                      <span key={e} className="analysis-tag">{e}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.tags?.length > 0 && (
                <div className="journal-analysis">
                  <p className="analysis-title">🏷️ Tags</p>
                  <div className="tag-row">
                    {selected.tags.map(t => (
                      <span key={t} className="analysis-tag tag-purple">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.riskKeywords?.length > 0 && (
                <div className="journal-analysis risk-alert">
                  <p className="analysis-title">⚠️ Risk Keywords Detected</p>
                  <div className="tag-row">
                    {selected.riskKeywords.map(k => (
                      <span key={k} className="analysis-tag tag-red">{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="journal-card journal-empty">
              <div className="journal-empty-content">
                <p>📖</p>
                <p>Select an entry to read it</p>
                <p>or write a new one</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default Journal;