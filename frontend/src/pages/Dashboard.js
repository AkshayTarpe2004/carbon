import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import API_BASE from "../config";
import { getStoredToken } from "../utils/auth";
import "./Dashboard.css";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

// Mock data – replace with API when backend is ready
const TIME_FILTERS = ["Daily", "Weekly", "Monthly"];
const LINE_COLOR = "#2ecc71";
// const EMISSION_BY_PERIOD = { Daily: 64.4, Weekly: 450.5, Monthly: 1850 };
// const CATEGORY_EMISSIONS = [
//   { label: "Transport", value: 142, unit: "kg CO₂e" },
//   { label: "Food", value: 98, unit: "kg CO₂e" },
//   { label: "Energy", value: 210, unit: "kg CO₂e" },
// ];
// const TREND_DATA = [
//   { date: "05-06", value: 58 },
//   { date: "05-07", value: 62 },
//   { date: "05-08", value: 55 },
//   { date: "05-09", value: 70 },
//   { date: "05-10", value: 65 },
//   { date: "05-11", value: 72 },
//   { date: "05-12", value: 64 },
// ];
// const RECENT_LOGS = [
//   { id: "1", date: "2024-05-12", total: 348 },
//   { id: "2", date: "2024-05-11", total: 337 },
//   { id: "3", date: "2024-05-10", total: 333 },
//   { id: "4", date: "2024-05-09", total: 326 },
//   { id: "5", date: "2024-05-08", total: 319 },
// ];

function Dashboard() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("Weekly");
  // const [summaryEmission, setSummaryEmission] = useState(EMISSION_BY_PERIOD.Weekly);
  // const [trendData, setTrendData] = useState(TREND_DATA);
  // const [recentLogs, setRecentLogs] = useState(RECENT_LOGS);
  const [logs, setLogs] = useState([]);

const formatDate = (date) => {
    return date.toLocaleDateString("en-CA");
  };

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchLogs = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const today = new Date();
        const to = formatDate(today);
        let fromDate = new Date();

        if (timeFilter === "Daily") {
          fromDate = today;
        } else if (timeFilter === "Weekly") {
          fromDate.setDate(today.getDate() - 7);
        } else if (timeFilter === "Monthly") {
          fromDate.setMonth(today.getMonth() - 1);
        }

        const from = formatDate(fromDate);
        const res = await axios.get(
          `${API_BASE}/carbon/logs?from=${from}&to=${to}`,
          { headers }
        );

        const data = Array.isArray(res.data) ? res.data : [];
        setLogs(data);
      } catch (err) {
        console.error("Error fetching carbon logs", err);
        setLogs([]);
      }
    };

    fetchLogs();
  }, [timeFilter, navigate]);

  // useEffect(() => {
  //   setSummaryEmission(EMISSION_BY_PERIOD[timeFilter] ?? EMISSION_BY_PERIOD.Weekly);
  // }, [timeFilter]);

  const safeLogs = Array.isArray(logs) ? logs : [];

  const summaryEmission = safeLogs.reduce(
  (sum, log) => sum + Number(log.totalEmission),
  0
);

const transportTotal = safeLogs.reduce(
  (sum, log) => sum + Number(log.transportEmission),
  0
);

const foodTotal = safeLogs.reduce(
  (sum, log) => sum + Number(log.foodEmission),
  0
);

const energyTotal = safeLogs.reduce(
  (sum, log) => sum + Number(log.energyEmission),
  0
);

const chartData = [...safeLogs]
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  .map(log => ({
    date: log.date,
    total: Number(log.totalEmission || 0)
  }));

const recentLogs = [...safeLogs]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 5);
  const hasChartData = chartData.length > 0;

  return (
    <AppLayout>
      <div className="dashboard-page">
        {/* 1. Carbon Summary Card – total emission + time filter */}
        <section className="dashboard-section card dashboard-summary-card">
          <h2 className="section-heading">Carbon Summary</h2>
          <div className="dashboard-summary-row">
            <div className="dashboard-summary-value-wrap">
              <span className="dashboard-summary-value" data-testid="total-emission">
                {summaryEmission.toFixed(2)} kg CO₂e
              </span>
              <span className="dashboard-summary-label">Total emission</span>
            </div>
            <div className="dashboard-summary-filter">
              <span className="dashboard-summary-filter-label">Time period</span>
              <div className="dashboard-time-filters">
                {TIME_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`dashboard-time-btn ${timeFilter === f ? "active" : ""}`}
                    onClick={() => setTimeFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Category-wise breakdown */}
        <section className="dashboard-section">
          <h2 className="section-heading">Category-wise Breakdown</h2>
          <div className="dashboard-category-cards">
            {/* {CATEGORY_EMISSIONS.map((cat) => (
              <div key={cat.label} className="card dashboard-category-card">
                <span className="dashboard-category-label">{cat.label} emissions</span>
                <span className="dashboard-category-value">{cat.value} {cat.unit}</span>
              </div>
            ))} */}
            <div className="card dashboard-category-card">
  <span className="dashboard-category-label">Transport emissions</span>
  <span className="dashboard-category-value">
    {transportTotal.toFixed(2)} kg CO₂e
  </span>
</div>

<div className="card dashboard-category-card">
  <span className="dashboard-category-label">Food emissions</span>
  <span className="dashboard-category-value">
    {foodTotal.toFixed(2)} kg CO₂e
  </span>
</div>

<div className="card dashboard-category-card">
  <span className="dashboard-category-label">Energy emissions</span>
  <span className="dashboard-category-value">
    {energyTotal.toFixed(2)} kg CO₂e
  </span>
</div>
          </div>
        </section>

        {/* 3. Emission Trend Chart */}
        <section className="dashboard-section card dashboard-trend-section">
          <h2 className="section-heading">Emission Trend</h2>
          <p className="section-sub">Line graph showing total emissions over time.</p>
          {!hasChartData ? (
            <div className="dashboard-empty-chart">
              No logs available for this time period.
            </div>
          ) : (
            <div className="dashboard-graph-card">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 12, right: 32, left: 8, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" interval={0} padding={{ left: 28, right: 28 }} tickMargin={10} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke={LINE_COLOR} strokeWidth={3} name="Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* 4. Recent Carbon Logs Table – Date, Total emission, View details */}
        <section className="dashboard-section card dashboard-logs-section">
          <div className="dashboard-logs-header">
            <div>
              <h2 className="section-heading">Recent Carbon Logs</h2>
              <p className="section-sub">Your latest footprint entries.</p>
            </div>
            <Link to="/carbon-history" className="dashboard-activity-link">View all</Link>
          </div>
          <div className="dashboard-logs-table-wrap">
            <table className="dashboard-logs-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transport</th>
                  <th>Food</th>
                  <th>Energy</th>
                  <th>Total emission</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{Number(row.transportEmission || 0).toFixed(2)} kg CO₂e</td>
                    <td>{Number(row.foodEmission || 0).toFixed(2)} kg CO₂e</td>
                    <td>{Number(row.energyEmission || 0).toFixed(2)} kg CO₂e</td>
                    <td className="dashboard-logs-total">
                      {Number(row.totalEmission).toFixed(2)} kg CO₂e</td>
                    <td>
                      <Link to={`/carbon-history?date=${row.date}`} className="dashboard-logs-action">
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}

export default Dashboard;
