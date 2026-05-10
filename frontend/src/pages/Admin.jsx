import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";
import "./Admin.css";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#a78bfa","#f9a8d4","#86efac","#fde68a","#93c5fd","#fb923c"];

const Admin = () => {
  const [analytics,    setAnalytics]    = useState(null);
  const [therapist,    setTherapist]    = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [anomalies,    setAnomalies]    = useState(null);
  const [dashboard,    setDashboard]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("overview");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, productivityRes, anomaliesRes] = await Promise.all([
        API.get("/admin/behavioral"),
        API.get("/admin/productivity"),
        API.get("/admin/anomalies"),
      ]);
      setAnalytics(analyticsRes.data);
      setProductivity(productivityRes.data);
      setAnomalies(anomaliesRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTherapist = async () => {
    try {
      const { data } = await API.get("/admin/therapist");
      setTherapist(data);
    } catch (err) { console.error(err); }
  };

  const fetchDashboard = async () => {
    try {
      const { data } = await API.get("/admin/dashboard");
      setDashboard(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (activeTab === "therapist" && !therapist)  fetchTherapist();
    if (activeTab === "dashboard" && !dashboard)  fetchDashboard();
  }, [activeTab]);

  const tabs = [
    { id: "overview",     label: "📊 Overview"     },
    { id: "therapist",    label: "👨‍⚕️ Therapist"    },
    { id: "productivity", label: "📈 Productivity"  },
    { id: "anomalies",    label: "🔍 Anomalies"     },
    { id: "dashboard",    label: "⚙️ Admin"          },
  ];

  const moodDistData = analytics?.moodDistribution?.map(d => ({
    name: d._id, value: d.count
  })) || [];

  const riskDistData = analytics?.riskDistribution?.map(d => ({
    name: d._id, value: d.count
  })) || [];

  if (loading) return (
    <Layout title="Admin">
      <div className="loading">Loading analytics... ⚙️</div>
    </Layout>
  );

  return (
    <Layout title="Admin & Analytics">
      <div className="admin-container">

        {/* Tabs */}
        <div className="admin-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? "tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && analytics && (
          <div className="admin-section">
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <p className="admin-stat-icon">👥</p>
                <p className="admin-stat-val">{analytics.overview?.totalUsers ?? 0}</p>
                <p className="admin-stat-lbl">Total Users</p>
              </div>
              <div className="admin-stat-card">
                <p className="admin-stat-icon">⚡</p>
                <p className="admin-stat-val">{analytics.overview?.activeToday ?? 0}</p>
                <p className="admin-stat-lbl">Active Today</p>
              </div>
              <div className="admin-stat-card">
                <p className="admin-stat-icon">📝</p>
                <p className="admin-stat-val">{analytics.overview?.totalMoodLogs ?? 0}</p>
                <p className="admin-stat-lbl">Total Mood Logs</p>
              </div>
              <div className="admin-stat-card">
                <p className="admin-stat-icon">😊</p>
                <p className="admin-stat-val">{analytics.overview?.avgMood ?? "—"}/10</p>
                <p className="admin-stat-lbl">Avg Mood</p>
              </div>
              <div className="admin-stat-card">
                <p className="admin-stat-icon">😰</p>
                <p className="admin-stat-val">{analytics.overview?.avgStress ?? "—"}/10</p>
                <p className="admin-stat-lbl">Avg Stress</p>
              </div>
            </div>

            <div className="admin-charts">
              {moodDistData.length > 0 && (
                <div className="admin-card">
                  <h3>🎭 Emotion Distribution</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={moodDistData}
                        cx="50%" cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {moodDistData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {riskDistData.length > 0 && (
                <div className="admin-card">
                  <h3>🔍 Risk Level Distribution</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={riskDistData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.2)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8888aa" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#8888aa" }} />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(255,255,255,0.95)",
                          border: "1px solid rgba(167,139,250,0.3)",
                          borderRadius: "10px",
                        }}
                      />
                      <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Therapist Tab */}
        {activeTab === "therapist" && (
          <div className="admin-section">
            {therapist ? (
              <>
                <div className="therapist-summary">
                  <div className="therapist-stat">
                    <p className="t-val">{therapist.totalPatients}</p>
                    <p className="t-lbl">Total Patients</p>
                  </div>
                  <div className="therapist-stat">
                    <p className="t-val" style={{ color: "#ef4444" }}>
                      {therapist.highRiskCount}
                    </p>
                    <p className="t-lbl">High Risk</p>
                  </div>
                </div>
                <div className="patients-table">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Last Active</th>
                        <th>Current Mood</th>
                        <th>Risk Level</th>
                        <th>Logs This Week</th>
                        <th>Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {therapist.patients?.map(p => (
                        <tr key={p.patientId}>
                          <td>
                            <div className="patient-info">
                              <div className="patient-avatar">
                                {p.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="patient-name">{p.name}</p>
                                <p className="patient-email">{p.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="table-text-light">
                            {new Date(p.lastActivity).toLocaleDateString()}
                          </td>
                          <td>
                            <span className="table-badge mood-badge">
                              {p.currentMood}/10
                            </span>
                          </td>
                          <td>
                            <span
                              className="table-badge"
                              style={{
                                background:
                                  p.riskLevel === "low"      ? "#bbf7d0" :
                                  p.riskLevel === "moderate" ? "#fef9c3" :
                                  p.riskLevel === "high"     ? "#fecaca" : "#fca5a5",
                                color: "#4a4a6a",
                              }}
                            >
                              {p.riskLevel}
                            </span>
                          </td>
                          <td className="table-text-light">{p.logsThisWeek}</td>
                          <td>
                            {p.alertFlag
                              ? <span className="alert-flag">🚨 Alert</span>
                              : <span className="clear-flag">✅ Clear</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="loading">Loading patient data...</div>
            )}
          </div>
        )}

        {/* Productivity Tab */}
        {activeTab === "productivity" && productivity && (
          <div className="admin-section">
            <div className="admin-card">
              <h3>📈 Productivity vs Mood Correlation</h3>
              <p className="card-desc">
                Comparing mood scores between productive and non-productive days
              </p>
              {productivity.correlation?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={productivity.correlation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.2)" />
                      <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#8888aa" }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#8888aa" }} />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(255,255,255,0.95)",
                          border: "1px solid rgba(167,139,250,0.3)",
                          borderRadius: "10px",
                        }}
                      />
                      <Bar dataKey="avgMood"   fill="#a78bfa" radius={[4,4,0,0]} name="Avg Mood" />
                      <Bar dataKey="avgStress" fill="#f9a8d4" radius={[4,4,0,0]} name="Avg Stress" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="correlation-cards">
                    {productivity.correlation.map((c, i) => (
                      <div key={i} className="corr-detail-card">
                        <p className="corr-detail-cat">{c.category}</p>
                        <p className="corr-detail-val">😊 Mood: {c.avgMood}/10</p>
                        {c.avgStress && (
                          <p className="corr-detail-val">😰 Stress: {c.avgStress}/10</p>
                        )}
                        <p className="corr-detail-samples">{c.samples} samples</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-data">
                  Not enough data for correlation analysis yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === "anomalies" && (
          <div className="admin-section">
            <div className="admin-card">
              <h3>🔍 Mood Anomaly Detection</h3>
              <p className="card-desc">
                Statistical outliers in your mood data (±2 standard deviations)
              </p>
              {anomalies ? (
                <>
                  <div className="anomaly-stats">
                    <div className="anomaly-stat">
                      <p className="a-val">{anomalies.mean}</p>
                      <p className="a-lbl">Mean Mood</p>
                    </div>
                    <div className="anomaly-stat">
                      <p className="a-val">{anomalies.std}</p>
                      <p className="a-lbl">Std Deviation</p>
                    </div>
                    <div className="anomaly-stat">
                      <p className="a-val">{anomalies.totalLogs}</p>
                      <p className="a-lbl">Total Logs</p>
                    </div>
                    <div className="anomaly-stat">
                      <p className="a-val" style={{ color: "#ef4444" }}>
                        {anomalies.anomalies?.length ?? 0}
                      </p>
                      <p className="a-lbl">Anomalies Found</p>
                    </div>
                  </div>

                  {anomalies.anomalies?.length > 0 ? (
                    <div className="anomalies-list">
                      {anomalies.anomalies.map((a, i) => (
                        <div
                          key={i}
                          className={`anomaly-item ${
                            a.type === "unusually_low" ? "anomaly-low" : "anomaly-high"
                          }`}
                        >
                          <span className="anomaly-icon">
                            {a.type === "unusually_low" ? "📉" : "📈"}
                          </span>
                          <div className="anomaly-info">
                            <p className="anomaly-date">
                              {new Date(a.date).toLocaleDateString()}
                            </p>
                            <p className="anomaly-emotion">{a.emotion}</p>
                          </div>
                          <div className="anomaly-scores">
                            <span className="anomaly-mood">Mood: {a.mood}/10</span>
                            <span className="anomaly-dev">
                              Deviation: {a.deviation}
                            </span>
                          </div>
                          <span className="anomaly-type">
                            {a.type?.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-anomalies">
                      ✅ No anomalies detected! Your mood patterns are consistent.
                    </div>
                  )}
                </>
              ) : (
                <div className="no-data">Loading anomaly data...</div>
              )}
            </div>
          </div>
        )}

        {/* Admin Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="admin-section">
            {dashboard ? (
              <>
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <p className="admin-stat-icon">👥</p>
                    <p className="admin-stat-val">{dashboard.totals?.users ?? 0}</p>
                    <p className="admin-stat-lbl">Total Users</p>
                  </div>
                  <div className="admin-stat-card">
                    <p className="admin-stat-icon">😊</p>
                    <p className="admin-stat-val">{dashboard.totals?.moodLogs ?? 0}</p>
                    <p className="admin-stat-lbl">Mood Logs</p>
                  </div>
                  <div className="admin-stat-card">
                    <p className="admin-stat-icon">😴</p>
                    <p className="admin-stat-val">{dashboard.totals?.sleepLogs ?? 0}</p>
                    <p className="admin-stat-lbl">Sleep Logs</p>
                  </div>
                  <div className="admin-stat-card">
                    <p className="admin-stat-icon">🔍</p>
                    <p className="admin-stat-val">{dashboard.totals?.riskAssessments ?? 0}</p>
                    <p className="admin-stat-lbl">Risk Assessments</p>
                  </div>
                </div>

                {dashboard.criticalAlerts?.length > 0 && (
                  <div className="admin-card">
                    <h3>🚨 Critical Alerts</h3>
                    {dashboard.criticalAlerts.map((a, i) => (
                      <div key={i} className="critical-alert-item">
                        <span className="critical-icon">🚨</span>
                        <div className="critical-info">
                          <p className="critical-name">{a.user?.name}</p>
                          <p className="critical-email">{a.user?.email}</p>
                        </div>
                        <span
                          className="critical-level"
                          style={{
                            background: a.level === "critical" ? "#fca5a5" : "#fde68a"
                          }}
                        >
                          {a.level?.toUpperCase()}
                        </span>
                        <span className="critical-date">
                          {new Date(a.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {dashboard.recentActivity?.length > 0 && (
                  <div className="admin-card">
                    <h3>📅 Recent Activity (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={dashboard.recentActivity.slice().reverse()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.2)" />
                        <XAxis
                          dataKey="_id"
                          tick={{ fontSize: 11, fill: "#8888aa" }}
                          tickFormatter={d => d.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 11, fill: "#8888aa" }} />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(255,255,255,0.95)",
                            border: "1px solid rgba(167,139,250,0.3)",
                            borderRadius: "10px",
                          }}
                        />
                        <Bar dataKey="count" fill="#a78bfa" radius={[4,4,0,0]} name="Logs" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <div className="loading">Loading admin dashboard...</div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Admin;