import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";
import "./Reports.css";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#a78bfa","#f9a8d4","#86efac","#fde68a","#93c5fd","#fb923c","#f472b6","#34d399"];

const Reports = () => {
  const [weekly,      setWeekly]      = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [exporting,   setExporting]   = useState(false);
  const [success,     setSuccess]     = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [weeklyRes, correlationRes] = await Promise.all([
        API.get("/report/weekly"),
        API.get("/report/correlation"),
      ]);
      setWeekly(weeklyRes.data);
      setCorrelation(correlationRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await API.get("/report/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `mindcare-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess("Data exported successfully! 📥");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { console.error(err); }
    finally { setExporting(false); }
  };

  const emotionChartData = weekly?.emotionBreakdown
    ? Object.entries(weekly.emotionBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  if (loading) return (
    <Layout title="Reports">
      <div className="loading">Generating your wellness report... 📊</div>
    </Layout>
  );

  return (
    <Layout title="Reports">
      <div className="reports-container">

        {/* Header */}
        <div className="reports-header">
          <div>
            <h2>📊 Weekly Wellness Report</h2>
            <p>
              {weekly?.period?.from
                ? `${new Date(weekly.period.from).toLocaleDateString()} — ${new Date(weekly.period.to).toLocaleDateString()}`
                : "Last 7 days"
              }
            </p>
          </div>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "📥 Export Data"}
          </button>
        </div>

        {success && <div className="success-msg">{success}</div>}

        {/* Summary Cards */}
        {weekly?.summary && (
          <div className="summary-grid">
            <div className="summary-card" style={{ borderTop: "4px solid #a78bfa" }}>
              <p className="summary-icon">😊</p>
              <p className="summary-val">{weekly.summary.avgMood ?? "—"}/10</p>
              <p className="summary-lbl">Avg Mood</p>
            </div>
            <div className="summary-card" style={{ borderTop: "4px solid #86efac" }}>
              <p className="summary-icon">😴</p>
              <p className="summary-val">{weekly.summary.avgSleep ?? "—"}h</p>
              <p className="summary-lbl">Avg Sleep</p>
            </div>
            <div className="summary-card" style={{ borderTop: "4px solid #f9a8d4" }}>
              <p className="summary-icon">😰</p>
              <p className="summary-val">{weekly.summary.avgStress ?? "—"}/10</p>
              <p className="summary-lbl">Avg Stress</p>
            </div>
            <div className="summary-card" style={{ borderTop: "4px solid #fde68a" }}>
              <p className="summary-icon">✅</p>
              <p className="summary-val">{weekly.summary.avgHabitCompletion ?? "—"}%</p>
              <p className="summary-lbl">Habit Rate</p>
            </div>
            <div className="summary-card" style={{ borderTop: "4px solid #93c5fd" }}>
              <p className="summary-icon">📝</p>
              <p className="summary-val">{weekly.summary.totalMoodLogs ?? 0}</p>
              <p className="summary-lbl">Mood Logs</p>
            </div>
            <div className="summary-card" style={{ borderTop: "4px solid #fb923c" }}>
              <p className="summary-icon">📔</p>
              <p className="summary-val">{weekly.summary.totalJournals ?? 0}</p>
              <p className="summary-lbl">Journals</p>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="reports-charts">

          {/* Daily Mood Chart */}
          {weekly?.daily?.length > 0 && (
            <div className="report-card">
              <h3>📈 Daily Mood & Stress</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weekly.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.2)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#8888aa" }}
                    tickFormatter={d => d.slice(5)}
                  />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#8888aa" }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      borderRadius: "10px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgMood"
                    stroke="#a78bfa"
                    strokeWidth={3}
                    dot={{ fill: "#a78bfa", r: 5 }}
                    name="Mood"
                  />
                  <Line
                    type="monotone"
                    dataKey="avgStress"
                    stroke="#f9a8d4"
                    strokeWidth={2}
                    dot={{ fill: "#f9a8d4", r: 4 }}
                    name="Stress"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Emotion Breakdown Pie */}
          {emotionChartData.length > 0 && (
            <div className="report-card">
              <h3>🎭 Emotion Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={emotionChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {emotionChartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Mood Performance Correlation */}
        {correlation?.insights && (
          <div className="report-card">
            <h3>🔗 Mood & Sleep Correlation</h3>
            <div className="correlation-grid">
              <div className="correlation-stat">
                <p className="corr-val">
                  {correlation.insights.avgMoodWithGoodSleep ?? "—"}
                </p>
                <p className="corr-lbl">Avg Mood with Good Sleep (7h+)</p>
                <div className="corr-bar-bg">
                  <div
                    className="corr-bar-fill good"
                    style={{ width: `${(correlation.insights.avgMoodWithGoodSleep / 10) * 100}%` }}
                  />
                </div>
              </div>
              <div className="correlation-stat">
                <p className="corr-val">
                  {correlation.insights.avgMoodWithPoorSleep ?? "—"}
                </p>
                <p className="corr-lbl">Avg Mood with Poor Sleep (&lt;7h)</p>
                <div className="corr-bar-bg">
                  <div
                    className="corr-bar-fill poor"
                    style={{ width: `${((correlation.insights.avgMoodWithPoorSleep || 0) / 10) * 100}%` }}
                  />
                </div>
              </div>
              <div className="correlation-stat highlight">
                <p className="corr-val">
                  {correlation.insights.sleepMoodImpact !== null
                    ? `+${correlation.insights.sleepMoodImpact}`
                    : "—"}
                </p>
                <p className="corr-lbl">Mood improvement with good sleep</p>
              </div>
            </div>
          </div>
        )}

        {/* Correlation Data Table */}
        {correlation?.correlation?.length > 0 && (
          <div className="report-card">
            <h3>📋 Daily Correlation Data</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mood</th>
                    <th>Stress</th>
                    <th>Sleep Hours</th>
                    <th>Emotion</th>
                  </tr>
                </thead>
                <tbody>
                  {correlation.correlation.map((row, i) => (
                    <tr key={i}>
                      <td>{row.date}</td>
                      <td>
                        <span className="table-badge mood-badge">{row.mood}/10</span>
                      </td>
                      <td>
                        <span className="table-badge stress-badge">{row.stressLevel}/10</span>
                      </td>
                      <td>{row.sleepHours ? `${row.sleepHours}h` : "—"}</td>
                      <td>
                        <span className="table-badge emotion-badge">{row.emotion}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Reports;