import { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function AdvancedAnalytics({ air }) {
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/reports")
      .then((response) => response.json())
      .then((data) => {
        setReports(data.reports || []);
        setLoadingReports(false);
      })
      .catch(() => {
        setLoadingReports(false);
      });
  }, []);

  // Get hotspot data
  const hotspots = Array.isArray(air?.hotspots)
    ? air.hotspots
    : [];

  // Convert values to numbers
  const values = hotspots.map((spot) => ({
    name: spot.name || "Location",
    PM25: Number(spot.pm25) || 0,
    PM10: Number(spot.pm10) || 0,
  }));

  // Average PM2.5
  const averagePM25 =
    values.length > 0
      ? values.reduce((sum, item) => sum + item.PM25, 0) /
        values.length
      : 0;

  // Average PM10
  const averagePM10 =
    values.length > 0
      ? values.reduce((sum, item) => sum + item.PM10, 0) /
        values.length
      : 0;

  // Highest hotspot
  const highestHotspot =
    values.length > 0
      ? values.reduce((highest, item) =>
          item.PM25 > highest.PM25 ? item : highest
        )
      : null;

  // Lowest hotspot
  const lowestHotspot =
    values.length > 0
      ? values.reduce((lowest, item) =>
          item.PM25 < lowest.PM25 ? item : lowest
        )
      : null;

  return (
    <section className="analytics-section">

      <div className="section-heading">
        <h2>📊 Advanced Analytics</h2>
        <p>
          Analyze pollution levels, hotspots, and citizen reports.
        </p>
      </div>

      <div className="analytics-cards">

        <div className="analytics-card">
          <span className="analytics-icon">🌫️</span>

          <div>
            <h3>Average PM2.5</h3>

            <strong>
              {averagePM25.toFixed(1)}
            </strong>

            <small>µg/m³</small>
          </div>
        </div>

        <div className="analytics-card">
          <span className="analytics-icon">💨</span>

          <div>
            <h3>Average PM10</h3>

            <strong>
              {averagePM10.toFixed(1)}
            </strong>

            <small>µg/m³</small>
          </div>
        </div>

        <div className="analytics-card">
          <span className="analytics-icon">🔴</span>

          <div>
            <h3>Highest Hotspot</h3>

            <strong>
              {highestHotspot
                ? highestHotspot.PM25.toFixed(1)
                : "—"}
            </strong>

            <small>
              {highestHotspot
                ? highestHotspot.name
                : "No data"}
            </small>
          </div>
        </div>

        <div className="analytics-card">
          <span className="analytics-icon">🟢</span>

          <div>
            <h3>Lowest Hotspot</h3>

            <strong>
              {lowestHotspot
                ? lowestHotspot.PM25.toFixed(1)
                : "—"}
            </strong>

            <small>
              {lowestHotspot
                ? lowestHotspot.name
                : "No data"}
            </small>
          </div>
        </div>

        <div className="analytics-card">
          <span className="analytics-icon">📢</span>

          <div>
            <h3>Citizen Reports</h3>

            <strong>
              {loadingReports
                ? "..."
                : reports.length}
            </strong>

            <small>
              Submitted reports
            </small>
          </div>
        </div>

      </div>

      <div className="analytics-chart-card">

        <h3>
          Pollution Comparison by Location
        </h3>

        {values.length > 0 ? (

          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <BarChart data={values}>

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="PM25"
                name="PM2.5"
              />

              <Bar
                dataKey="PM10"
                name="PM10"
              />

            </BarChart>
          </ResponsiveContainer>

        ) : (

          <p className="analytics-empty">
            Pollution data is not available yet.
          </p>

        )}

      </div>

    </section>
  );
}

export default AdvancedAnalytics;