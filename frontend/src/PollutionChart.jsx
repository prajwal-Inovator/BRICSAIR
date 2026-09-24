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

function PollutionChart({ hotspots = [], air = null, location = null }) {
  let chartData = [];

  // ---------------------------------------------
  // USE HOTSPOTS WHEN AVAILABLE
  // ---------------------------------------------
  if (Array.isArray(hotspots) && hotspots.length > 0) {
    chartData = hotspots
      .map((spot) => ({
        name: spot.name || "Location",
        PM25: Number(spot.pm25),
        PM10: Number(spot.pm10),
      }))
      .filter(
        (spot) =>
          Number.isFinite(spot.PM25) ||
          Number.isFinite(spot.PM10)
      );
  }

  // ---------------------------------------------
  // FALLBACK TO CURRENT CITY DATA
  // ---------------------------------------------
  if (chartData.length === 0 && air) {
    const pm25 = Number(air.pm25);
    const pm10 = Number(air.pm10);

    if (
      Number.isFinite(pm25) ||
      Number.isFinite(pm10)
    ) {
      chartData = [
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

  if (chartData.length === 0) {
    return (
      <div className="pollution-chart-empty">
        <h3>📊 Pollution Level</h3>
        <p>No pollution data available.</p>
      </div>
    );
  }

  return (
    <div className="pollution-chart">

      <div className="pollution-chart-header">
        <div>
          <span className="pollution-chart-eyebrow">
            CURRENT LOCATION
          </span>

          <h3>
            📊 Pollution Level
          </h3>
        </div>

        <span className="pollution-chart-location">
          📍{" "}
          {location?.name ||
            air?.city ||
            "Current Location"}
        </span>
      </div>

      <ResponsiveContainer
        width="100%"
        height={360}
      >
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 10,
            bottom: 50,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="name"
            angle={
              chartData.length > 2
                ? -25
                : 0
            }
            textAnchor={
              chartData.length > 2
                ? "end"
                : "middle"
            }
            interval={0}
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

    </div>
  );
}

export default PollutionChart;