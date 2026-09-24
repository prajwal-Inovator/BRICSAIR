import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function ForecastChart({ forecast = [] }) {
  const chartData = forecast.map((item) => ({
    time: item.time.substring(11, 16),
    PM25: Number(item.pm25),
    PM10: Number(item.pm10),
  }));

  return (
    <div className="forecast-chart-card">
      <div className="chart-heading">
        <div>
          <span className="section-label">AI & DATA FORECAST</span>
          <h2>24-Hour Pollution Forecast</h2>
        </div>

        <span className="forecast-badge">
          NEXT 24 HOURS
        </span>
      </div>

      <div style={{ width: "100%", height: "380px" }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="time"
              interval={2}
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

            <Line
              type="monotone"
              dataKey="PM25"
              strokeWidth={3}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="PM10"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ForecastChart;