import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../api/axios";
import "./Dashboard.css";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value ?? "—"}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [todayMood,  setTodayMood]  = useState(null);
  const [moodTrend,  setMoodTrend]  = useState([]);
  const [sleepData,  setSleepData]  = useState(null);
  const [riskData,   setRiskData]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [mood, trend, sleep, risk] = await Promise.all([
          API.get("/mood/today"),
          API.get("/mood/trend"),
          API.get("/sleep/analytics"),
          API.get("/risk/latest"),
        ]);
        setTodayMood(mood.data);
        setMoodTrend(trend.data);
        setSleepData(sleep.data);
        setRiskData(risk.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const riskColors = {
    low:      "#86efac",
    moderate: "#fde68a",
    high:     "#fca5a5",
    critical: "#f87171",
  };

  if (loading) return (
    <Layout title="Dashboard">
      <div className="loading">Loading your wellness data... 🌸</div>
    </Layout>
  );

  return (
    <Layout title="Dashboard">
      <div className="dashboard">

        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div>
            <h2>Good {getTimeOfDay()}! 🌿</h2>
            <p>Here's your mental wellness overview for today.</p>
          </div>
          <button className="log-mood-btn" onClick={() => navigate("/mood")}>
            + Log Today's Mood
          </button>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid">
          <StatCard
            icon="😊"
            label="Today's Avg Mood"
            value={todayMood?.averageMood ? `${todayMood.averageMood}/10` : "Not logged"}
            color="#a78bfa"
          />
          <StatCard
            icon="😴"
            label="Avg Sleep"
            value={sleepData?.avgDuration ? `${sleepData.avgDuration} hrs` : "No data"}
            color="#86efac"
          />
          <StatCard
            icon="🔍"
            label="Risk Level"
            value={riskData?.riskLevel ? riskData.riskLevel.toUpperCase() : "Not assessed"}
            color={riskColors[riskData?.riskLevel] || "#a78bfa"}
          />
          <StatCard
            icon="📔"
            label="Mood Logs Today"
            value={todayMood?.count ?? 0}
            color="#f9a8d4"
          />
        </div>

        {/* Mood Trend Chart */}
        <div className="dashboard-card">
          <h3>📈 Mood Trend (Last 30 Days)</h3>
          {moodTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={moodTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.2)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#8888aa" }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis domain={[1, 10]} tick={{ fontSize: 12, fill: "#8888aa" }} />
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
          ) : (
            <div className="no-data">
              No mood data yet. <span onClick={() => navigate("/mood")}>Log your first mood →</span>
            </div>
          )}
        </div>

        {/* Bottom Row */}
        <div className="dashboard-bottom">

          {/* Sleep Summary */}
          <div className="dashboard-card">
            <h3>😴 Sleep Summary</h3>
            {sleepData?.avgDuration ? (
              <div className="sleep-summary">
                <div className="sleep-stat">
                  <p className="sleep-val">{sleepData.avgDuration}h</p>
                  <p className="sleep-lbl">Avg Duration</p>
                </div>
                <div className="sleep-stat">
                  <p className="sleep-val">{sleepData.avgScore}</p>
                  <p className="sleep-lbl">Sleep Score</p>
                </div>
                <div className="sleep-stat">
                  <p className="sleep-val">{sleepData.trend}</p>
                  <p className="sleep-lbl">Trend</p>
                </div>
              </div>
            ) : (
              <div className="no-data">
                No sleep data. <span onClick={() => navigate("/sleep")}>Log sleep →</span>
              </div>
            )}
          </div>

          {/* Risk Summary */}
          <div className="dashboard-card">
            <h3>🔍 Risk Assessment</h3>
            {riskData?.riskLevel ? (
              <div className="risk-summary">
                <div
                  className="risk-badge-large"
                  style={{ background: riskColors[riskData.riskLevel] }}
                >
                  {riskData.riskLevel?.toUpperCase()}
                </div>
                <p className="risk-score">Risk Score: {riskData.riskScore}/100</p>
                <p className="risk-burnout">
                  Burnout Stage: {riskData.burnoutStage || "none"}
                </p>
                <button
                  className="assess-btn"
                  onClick={() => navigate("/risk")}
                >
                  Run New Assessment
                </button>
              </div>
            ) : (
              <div className="no-data">
                <span onClick={() => navigate("/risk")}>Run your first assessment →</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
};

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
};

export default Dashboard;