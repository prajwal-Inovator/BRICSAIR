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

function AdvancedAnalytics({
  air,
  location,
}) {
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] =
    useState(true);

  // ---------------------------------------------
  // LOAD CITIZEN REPORTS
  // ---------------------------------------------
  useEffect(() => {
    async function loadReports() {
      try {
        const response = await fetch(
          "https://bricsair.onrender.com/api/reports"
        );

        if (!response.ok) {
          throw new Error(
            "Reports unavailable"
          );
        }

        const data = await response.json();

        setReports(data.reports || []);
      } catch (error) {
        console.error(
          "Reports error:",
          error
        );

        setReports([]);
      } finally {
        setLoadingReports(false);
      }
    }

    loadReports();
  }, []);

  // ---------------------------------------------
  // PREPARE CURRENT CITY DATA
  // ---------------------------------------------

  let values = [];

  // First use hotspots
  if (
    Array.isArray(air?.hotspots) &&
    air.hotspots.length > 0
  ) {
    values = air.hotspots
      .map((spot) => ({
        name:
          spot.name ||
          location?.name ||
          "Location",

        PM25: Number(spot.pm25),

        PM10: Number(spot.pm10),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.PM25) ||
          Number.isFinite(item.PM10)
      );
  }

  // ---------------------------------------------
  // FALLBACK: CURRENT CITY VALUES
  // ---------------------------------------------

  if (values.length === 0 && air) {
    const pm25 = Number(air.pm25);
    const pm10 = Number(air.pm10);

    if (
      Number.isFinite(pm25) ||
      Number.isFinite(pm10)
    ) {
      values = [
        {
          name:
            location?.name ||
            air.city ||
            "Current Location",

          PM25: Number.isFinite(pm25)
            ? pm25
            : 0,

          PM10: Number.isFinite(pm10)
            ? pm10
            : 0,
        },
      ];
    }
  }

  // ---------------------------------------------
  // CALCULATE AVERAGES
  // ---------------------------------------------

  const averagePM25 =
    values.length > 0
      ? values.reduce(
          (sum, item) =>
            sum + item.PM25,
          0
        ) / values.length
      : 0;

  const averagePM10 =
    values.length > 0
      ? values.reduce(
          (sum, item) =>
            sum + item.PM10,
          0
        ) / values.length
      : 0;

  // ---------------------------------------------
  // HIGHEST HOTSPOT
  // ---------------------------------------------

  const highestHotspot =
    values.length > 0
      ? values.reduce(
          (highest, item) =>
            item.PM25 >
            highest.PM25
              ? item
              : highest
        )
      : null;

  // ---------------------------------------------
  // LOWEST HOTSPOT
  // ---------------------------------------------

  const lowestHotspot =
    values.length > 0
      ? values.reduce(
          (lowest, item) =>
            item.PM25 <
            lowest.PM25
              ? item
              : lowest
        )
      : null;

  return (
    <section className="analytics-section">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div className="section-heading">

        <div>
          <h2>
            📊 Pollution Analytics
          </h2>

          <p>
            Current pollution analysis for{" "}
            <strong>
              {location?.name ||
                air?.city ||
                "selected location"}
            </strong>
            .
          </p>
        </div>

      </div>

      {/* ========================================= */}
      {/* ANALYTICS CARDS */}
      {/* ========================================= */}

      <div className="analytics-cards">

        {/* AVERAGE PM2.5 */}

        <div className="analytics-card">

          <span className="analytics-icon">
            🌫️
          </span>

          <div>
            <h3>
              Average PM2.5
            </h3>

            <strong>
              {values.length > 0
                ? averagePM25.toFixed(1)
                : "—"}
            </strong>

            <small>
              µg/m³
            </small>
          </div>

        </div>

        {/* AVERAGE PM10 */}

        <div className="analytics-card">

          <span className="analytics-icon">
            💨
          </span>

          <div>
            <h3>
              Average PM10
            </h3>

            <strong>
              {values.length > 0
                ? averagePM10.toFixed(1)
                : "—"}
            </strong>

            <small>
              µg/m³
            </small>
          </div>

        </div>

        {/* HIGHEST */}

        <div className="analytics-card">

          <span className="analytics-icon">
            🔴
          </span>

          <div>
            <h3>
              Highest PM2.5
            </h3>

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

        {/* LOWEST */}

        <div className="analytics-card">

          <span className="analytics-icon">
            🟢
          </span>

          <div>
            <h3>
              Lowest PM2.5
            </h3>

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

        {/* REPORTS */}

        <div className="analytics-card">

          <span className="analytics-icon">
            📢
          </span>

          <div>
            <h3>
              Citizen Reports
            </h3>

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

      {/* ========================================= */}
      {/* CHART */}
      {/* ========================================= */}

      <div className="analytics-chart-card">

        <div className="analytics-chart-header">

          <div>
            <h3>
              Pollution Comparison
            </h3>

            <p>
              PM2.5 and PM10 levels for{" "}
              <strong>
                {location?.name ||
                  air?.city ||
                  "selected location"}
              </strong>
            </p>
          </div>

        </div>

        {values.length > 0 ? (

          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <BarChart
              data={values}
              margin={{
                top: 20,
                right: 30,
                left: 10,
                bottom: 40,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="name"
              />

              <YAxis
                label={{
                  value: "µg/m³",
                  angle: -90,
                  position: "insideLeft",
                }}
              />

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

          <div className="analytics-empty">

            <div>
              📊
            </div>

            <h3>
              Pollution data unavailable
            </h3>

            <p>
              Select a city or search for a
              location to load pollution data.
            </p>

          </div>

        )}

      </div>

    </section>
  );
}

export default AdvancedAnalytics;