import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";
import "./RiskAssessment.css";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

const RiskAssessment = () => {
  const [latest,  setLatest]  = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [latestRes, historyRes] = await Promise.all([
        API.get("/risk/latest"),
        API.get("/risk/history"),
      ]);
      setLatest(latestRes.data);
      setHistory(historyRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const runAssessment = async () => {
    setRunning(true);
    try {
      const { data } = await API.post("/risk/assess");
      setLatest(data);
      setSuccess("Assessment complete! 🔍");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { console.error(err); }
    finally { setRunning(false); }
  };

  const riskColors = {
    low:      "#86efac",
    moderate: "#fde68a",
    high:     "#fca5a5",
    critical: "#f87171",
  };

  const riskLevelNum = { low: 1, moderate: 2, high: 3, critical: 4 };

  const radarData = latest ? [
    { subject: "Stress",  value: latest.stressIndex  || 0 },
    { subject: "Burnout", value: latest.burnoutScore || 0 },
    { subject: "Risk",    value: latest.riskScore    || 0 },
    { subject: "Mood",    value: latest.moodAvg ? (10 - latest.moodAvg) * 10 : 50 },
    { subject: "Sleep",   value: latest.sleepDebt ? Math.min(100, latest.sleepDebt * 10) : 0 },
  ] : [];

  const historyChartData = history.slice().reverse().map(r => ({
    date:  new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: r.riskScore,
    level: riskLevelNum[r.riskLevel],
  }));

  if (loading) return (
    <Layout title="Risk Assessment">
      <div className="loading">Analyzing your wellness data... 🔍</div>
    </Layout>
  );

  return (
    <Layout title="Risk Assessment">
      <div className="risk-container">

        {/* Run Assessment Button */}
        <div className="risk-hero">
          <div className="risk-hero-left">
            <h2>Mental Health Risk Analysis</h2>
            <p>AI-powered assessment based on your mood, sleep, and habit data</p>
            {success && <div className="success-msg">{success}</div>}
          </div>
          <button
            className="run-btn"
            onClick={runAssessment}
            disabled={running}
          >
            {running ? "Analyzing... 🔄" : "🔍 Run Assessment"}
          </button>
        </div>

        {latest?.riskLevel && (
          <>
            {/* Risk Level Banner */}
            <div
              className="risk-banner"
              style={{ background: riskColors[latest.riskLevel] }}
            >
              <div className="risk-banner-left">
                <p className="risk-banner-label">Current Risk Level</p>
                <p className="risk-banner-level">{latest.riskLevel?.toUpperCase()}</p>
                <p className="risk-banner-score">Risk Score: {latest.riskScore}/100</p>
              </div>
              <div className="risk-banner-right">
                <p className="risk-banner-label">Predicted Next Week</p>
                <p className="risk-banner-level">{latest.predictedRiskNextWeek?.toUpperCase()}</p>
                <p className="risk-banner-score">
                  Confidence: {latest.forecastConfidence}%
                </p>
              </div>
            </div>

            {/* Middle Row */}
            <div className="risk-middle">

              {/* Burnout & Stress */}
              <div className="risk-card">
                <h3>🔥 Burnout & Stress</h3>
                <div className="burnout-grid">
                  <div className="burnout-stat">
                    <div
                      className="burnout-circle"
                      style={{ borderColor: riskColors[latest.riskLevel] }}
                    >
                      <p className="burnout-val">{latest.stressIndex}</p>
                      <p className="burnout-lbl">Stress</p>
                    </div>
                  </div>
                  <div className="burnout-stat">
                    <div
                      className="burnout-circle"
                      style={{ borderColor: riskColors[latest.riskLevel] }}
                    >
                      <p className="burnout-val">{latest.burnoutScore}</p>
                      <p className="burnout-lbl">Burnout</p>
                    </div>
                  </div>
                </div>
                <div
                  className="burnout-stage"
                  style={{ background: riskColors[latest.burnoutStage === "none" ? "low" : latest.riskLevel] }}
                >
                  Burnout Stage: {latest.burnoutStage}
                </div>
                {latest.burnoutIndicators?.length > 0 && (
                  <div className="indicators">
                    {latest.burnoutIndicators.map((ind, i) => (
                      <span key={i} className="indicator-tag">⚠️ {ind}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Radar Chart */}
              {radarData.length > 0 && (
                <div className="risk-card">
                  <h3>📡 Risk Radar</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(167,139,250,0.3)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 12, fill: "#8888aa" }}
                      />
                      <Radar
                        dataKey="value"
                        stroke="#a78bfa"
                        fill="#a78bfa"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Triggers */}
              <div className="risk-card">
                <h3>🎯 Trigger Patterns</h3>
                {latest.triggers?.length > 0 ? (
                  latest.triggers.map((t, i) => (
                    <div key={i} className="trigger-row">
                      <span className="trigger-type">{t.type}</span>
                      <div className="trigger-bar-bg">
                        <div
                          className="trigger-bar-fill"
                          style={{ width: `${Math.min(100, t.frequency * 20)}%` }}
                        />
                      </div>
                      <span className="trigger-freq">{t.frequency}x</span>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    No trigger patterns detected yet. Log more mood entries with triggers.
                  </div>
                )}
              </div>
            </div>

            {/* Risk History Chart */}
            {historyChartData.length > 1 && (
              <div className="risk-card">
                <h3>📈 Risk Score History</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={historyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.2)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8888aa" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#8888aa" }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.95)",
                        border: "1px solid rgba(167,139,250,0.3)",
                        borderRadius: "10px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#a78bfa"
                      strokeWidth={3}
                      dot={{ fill: "#a78bfa", r: 5 }}
                      name="Risk Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recommended Actions */}
            {latest.recommendedActions?.length > 0 && (
              <div className="risk-card">
                <h3>💡 Recommended Actions</h3>
                <div className="actions-grid">
                  {latest.recommendedActions.map((action, i) => (
                    <div key={i} className="action-item">
                      <span className="action-num">{i + 1}</span>
                      <span className="action-text">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!latest?.riskLevel && (
          <div className="risk-empty">
            <p>🔍</p>
            <p>No assessment yet</p>
            <p>Click "Run Assessment" to analyze your mental health data</p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default RiskAssessment;