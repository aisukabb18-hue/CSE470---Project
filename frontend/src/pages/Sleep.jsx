import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";
import "./Sleep.css";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";

const Sleep = () => {
  const [form, setForm] = useState({
    bedtime: "23:00", wakeTime: "07:00",
    quality: 3, interrupted: false,
    interruptionCount: 0, notes: "",
  });
  const [logs,      setLogs]      = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState("");
  const [error,     setError]     = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [logsRes, analyticsRes] = await Promise.all([
        API.get("/sleep"),
        API.get("/sleep/analytics"),
      ]);
      setLogs(logsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await API.post("/sleep", form);
      setSuccess("Sleep logged successfully! 😴");
      setForm({
        bedtime: "23:00", wakeTime: "07:00",
        quality: 3, interrupted: false,
        interruptionCount: 0, notes: "",
      });
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to log sleep");
    } finally {
      setLoading(false);
    }
  };

  const getQualityLabel = (q) => {
    const labels = { 1: "Very Poor 😣", 2: "Poor 😔", 3: "Fair 😐", 4: "Good 😊", 5: "Excellent 😄" };
    return labels[q] || "Fair";
  };

  const getTrendColor = (trend) => {
    if (trend === "improving") return "#86efac";
    if (trend === "stable")    return "#fde68a";
    return "#fca5a5";
  };

  return (
    <Layout title="Sleep Tracker">
      <div className="sleep-container">
        <div className="sleep-top">
          <div className="sleep-card">
            <h3>😴 Log Sleep</h3>
            {success && <div className="success-msg">{success}</div>}
            {error   && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="sleep-times">
                <div className="form-section">
                  <label>🌙 Bedtime</label>
                  <input
                    type="time"
                    value={form.bedtime}
                    onChange={e => setForm({ ...form, bedtime: e.target.value })}
                    className="time-input"
                    required
                  />
                </div>
                <div className="form-section">
                  <label>☀️ Wake Time</label>
                  <input
                    type="time"
                    value={form.wakeTime}
                    onChange={e => setForm({ ...form, wakeTime: e.target.value })}
                    className="time-input"
                    required
                  />
                </div>
              </div>
              <div className="form-section">
                <label>
                  Sleep Quality
                  <span className="slider-value">{getQualityLabel(form.quality)}</span>
                </label>
                <input
                  type="range" min="1" max="5"
                  value={form.quality}
                  onChange={e => setForm({ ...form, quality: Number(e.target.value) })}
                  className="mood-slider"
                />
                <div className="slider-labels">
                  <span>Very Poor</span>
                  <span>Excellent</span>
                </div>
              </div>
              <div className="form-section">
                <label>Was sleep interrupted?</label>
                <div className="toggle-row">
                  <button
                    type="button"
                    className={`toggle-btn ${!form.interrupted ? "toggle-active" : ""}`}
                    onClick={() => setForm({ ...form, interrupted: false })}
                  >No</button>
                  <button
                    type="button"
                    className={`toggle-btn ${form.interrupted ? "toggle-active" : ""}`}
                    onClick={() => setForm({ ...form, interrupted: true })}
                  >Yes</button>
                </div>
              </div>
              {form.interrupted && (
                <div className="form-section">
                  <label>
                    Interruption Count
                    <span className="slider-value">{form.interruptionCount}x</span>
                  </label>
                  <input
                    type="range" min="0" max="10"
                    value={form.interruptionCount}
                    onChange={e => setForm({ ...form, interruptionCount: Number(e.target.value) })}
                    className="mood-slider"
                  />
                </div>
              )}
              <div className="form-section">
                <label>Notes</label>
                <textarea
                  placeholder="Any notes about your sleep..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="sleep-textarea"
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Saving..." : "Log Sleep 😴"}
              </button>
            </form>
          </div>

          {analytics?.avgDuration && (
            <div className="sleep-card">
              <h3>📊 Sleep Analytics</h3>
              <div className="analytics-grid">
                <div className="analytics-stat">
                  <p className="analytics-val">{analytics.avgDuration}h</p>
                  <p className="analytics-lbl">Avg Duration</p>
                </div>
                <div className="analytics-stat">
                  <p className="analytics-val">{analytics.avgQuality}/5</p>
                  <p className="analytics-lbl">Avg Quality</p>
                </div>
                <div className="analytics-stat">
                  <p className="analytics-val">{analytics.avgScore}</p>
                  <p className="analytics-lbl">Sleep Score</p>
                </div>
                <div className="analytics-stat">
                  <p className="analytics-val">{analytics.totalSleepDebt}h</p>
                  <p className="analytics-lbl">Sleep Debt</p>
                </div>
              </div>
              <div
                className="trend-badge"
                style={{ background: getTrendColor(analytics.trend) }}
              >
                Trend: {analytics.trend}
              </div>
              {analytics.weekly?.length > 0 && (
                <div className="sleep-chart">
                  <p className="chart-title">Duration This Week</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={analytics.weekly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.2)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#8888aa" }}
                        tickFormatter={d => d.slice(5)}
                      />
                      <YAxis domain={[0, 12]} tick={{ fontSize: 11, fill: "#8888aa" }} />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(255,255,255,0.95)",
                          border: "1px solid rgba(167,139,250,0.3)",
                          borderRadius: "10px",
                        }}
                      />
                      <Bar dataKey="duration" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Hours" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sleep-card">
          <h3>📋 Sleep History</h3>
          {logs.length === 0 ? (
            <div className="no-data">No sleep logs yet. Log your first sleep!</div>
          ) : (
            <div className="sleep-log-grid">
              {logs.map(log => (
                <div key={log._id} className="sleep-log-card">
                  <div className="sleep-log-header">
                    <span className="sleep-log-date">
                      {new Date(log.date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric"
                      })}
                    </span>
                    <span
                      className="sleep-score-badge"
                      style={{
                        background: log.sleepScore >= 80 ? "#bbf7d0" :
                                    log.sleepScore >= 60 ? "#fef9c3" : "#fecaca"
                      }}
                    >
                      Score: {log.sleepScore}
                    </span>
                  </div>
                  <div className="sleep-log-times">
                    <span>🌙 {log.bedtime}</span>
                    <span>→</span>
                    <span>☀️ {log.wakeTime}</span>
                  </div>
                  <div className="sleep-log-stats">
                    <span>⏱️ {log.duration}h</span>
                    <span>⭐ {log.quality}/5</span>
                    {log.interrupted && <span>😤 Interrupted</span>}
                  </div>
                  {log.notes && (
                    <p className="sleep-log-notes">{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default Sleep;