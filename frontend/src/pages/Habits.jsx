import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";
import "./Habits.css";

const categories = ["wellness","exercise","nutrition","mindfulness","social","work","sleep","other"];
const icons       = ["⭐","💪","🥗","🧘","👥","💼","😴","✨","🎯","📚","🏃","💧"];
const colors      = ["#a78bfa","#f9a8d4","#86efac","#fde68a","#93c5fd","#fb923c","#f472b6","#34d399"];

const Habits = () => {
  const [habits,    setHabits]    = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState("");
  const [error,     setError]     = useState("");
  const [form, setForm] = useState({
    name: "", category: "wellness",
    frequency: "daily", targetDays: 7,
    color: "#a78bfa", icon: "⭐",
  });

  useEffect(() => { fetchHabits(); }, []);

  const fetchHabits = async () => {
    try {
      const { data } = await API.get("/habits");
      setHabits(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await API.post("/habits", form);
      setSuccess("Habit created! ✅");
      setForm({ name: "", category: "wellness", frequency: "daily", targetDays: 7, color: "#a78bfa", icon: "⭐" });
      setShowForm(false);
      fetchHabits();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create habit");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (habitId, completed) => {
    try {
      await API.post("/habits/completion", {
        habitId,
        completed,
        date: new Date(),
      });
      fetchHabits();
    } catch (err) { console.error(err); }
  };

  const getStreakEmoji = (streak) => {
    if (streak >= 30) return "🔥🔥🔥";
    if (streak >= 14) return "🔥🔥";
    if (streak >= 7)  return "🔥";
    if (streak >= 3)  return "⚡";
    return "✨";
  };

  return (
    <Layout title="Habit Tracker">
      <div className="habits-container">

        {/* Header */}
        <div className="habits-header">
          <div>
            <h2>Your Habits</h2>
            <p>{habits.length} habits tracked</p>
          </div>
          <button
            className="add-habit-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "✕ Cancel" : "+ Add Habit"}
          </button>
        </div>

        {success && <div className="success-msg">{success}</div>}
        {error   && <div className="error-msg">{error}</div>}

        {/* Add Habit Form */}
        {showForm && (
          <div className="habit-form-card">
            <h3>➕ New Habit</h3>
            <form onSubmit={handleSubmit}>
              <div className="habit-form-grid">
                <div className="form-section">
                  <label>Habit Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning Meditation"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    className="habit-input"
                  />
                </div>
                <div className="form-section">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="habit-select"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-section">
                  <label>Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={e => setForm({ ...form, frequency: e.target.value })}
                    className="habit-select"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="form-section">
                  <label>
                    Target Days/Week
                    <span className="slider-value">{form.targetDays} days</span>
                  </label>
                  <input
                    type="range" min="1" max="7"
                    value={form.targetDays}
                    onChange={e => setForm({ ...form, targetDays: Number(e.target.value) })}
                    className="mood-slider"
                  />
                </div>
              </div>

              <div className="form-section">
                <label>Pick an Icon</label>
                <div className="icon-grid">
                  {icons.map(icon => (
                    <button
                      key={icon} type="button"
                      className={`icon-btn ${form.icon === icon ? "icon-btn-active" : ""}`}
                      onClick={() => setForm({ ...form, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label>Pick a Color</label>
                <div className="color-grid">
                  {colors.map(color => (
                    <button
                      key={color} type="button"
                      className={`color-btn ${form.color === color ? "color-btn-active" : ""}`}
                      style={{ background: color }}
                      onClick={() => setForm({ ...form, color })}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Creating..." : "Create Habit ✅"}
              </button>
            </form>
          </div>
        )}

        {/* Habits Grid */}
        {habits.length === 0 ? (
          <div className="no-habits">
            <p>🌱</p>
            <p>No habits yet.</p>
            <p>Click "+ Add Habit" to start tracking!</p>
          </div>
        ) : (
          <div className="habits-grid">
            {habits.map(habit => (
              <div
                key={habit._id}
                className="habit-card"
                style={{ borderTop: `4px solid ${habit.color}` }}
              >
                <div className="habit-card-header">
                  <span className="habit-icon">{habit.icon}</span>
                  <div className="habit-info">
                    <p className="habit-name">{habit.name}</p>
                    <p className="habit-category">{habit.category}</p>
                  </div>
                  <span className="habit-streak">
                    {getStreakEmoji(habit.currentStreak)} {habit.currentStreak}
                  </span>
                </div>

                <div className="habit-stats">
                  <div className="habit-stat">
                    <p className="habit-stat-val">{habit.completionRate}%</p>
                    <p className="habit-stat-lbl">Rate</p>
                  </div>
                  <div className="habit-stat">
                    <p className="habit-stat-val">{habit.currentStreak}</p>
                    <p className="habit-stat-lbl">Streak</p>
                  </div>
                  <div className="habit-stat">
                    <p className="habit-stat-val">{habit.longestStreak}</p>
                    <p className="habit-stat-lbl">Best</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${habit.completionRate}%`,
                      background: habit.color,
                    }}
                  />
                </div>

                {/* Complete Button */}
                <div className="habit-actions">
                  <button
                    className="complete-btn"
                    style={{ background: habit.color }}
                    onClick={() => handleComplete(habit._id, true)}
                  >
                    ✓ Done Today
                  </button>
                  <button
                    className="skip-btn"
                    onClick={() => handleComplete(habit._id, false)}
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Habits;