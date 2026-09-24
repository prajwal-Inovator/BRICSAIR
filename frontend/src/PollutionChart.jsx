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

function PollutionChart({ hotspots = [] }) {
  const chartData = Array.isArray(hotspots)
    ? hotspots.map((spot) => ({
        name: spot.name || "Location",
        PM25: Number(spot.pm25) || 0,
        PM10: Number(spot.pm10) || 0,
      }))
    : [];

  if (chartData.length === 0) {
    return (
      <div className="pollution-chart-empty">
        <h3>📊 Pollution Comparison</h3>
        <p>No pollution data available.</p>
      </div>
    );
  }

  return (
    <div className="pollution-chart">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 70,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="name"
            angle={-25}
            textAnchor="end"
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