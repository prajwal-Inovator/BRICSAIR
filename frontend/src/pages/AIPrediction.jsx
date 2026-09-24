import { useEffect, useState } from "react";
import ForecastChart from "../ForecastChart";
import PollutionImageAnalysis from "../PollutionImageAnalysis";

function AIPrediction() {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      "https://bricsair.onrender.com/api/forecast?lat=12.9716&lon=77.5946"
    )
      .then((response) => response.json())
      .then((data) => {
        setForecast(data.forecast || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Forecast error:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-container">
      <h1>🤖 AI & Prediction</h1>

      <p>
        Use machine learning and AI to analyze and predict air pollution.
      </p>

      <div className="page-feature">
        <h2>📈 24-Hour Pollution Forecast</h2>

        {loading ? (
          <p>Loading forecast...</p>
        ) : forecast.length > 0 ? (
          <ForecastChart forecast={forecast} />
        ) : (
          <p>Unable to load forecast data.</p>
        )}
      </div>

      <div className="page-feature">
        <h2>🧠 AI Pollution Image Analysis</h2>
        <PollutionImageAnalysis />
      </div>
    </div>
  );
}

export default AIPrediction;