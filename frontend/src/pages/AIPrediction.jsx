import { useEffect, useState } from "react";
import ForecastChart from "../ForecastChart";
import PollutionImageAnalysis from "../PollutionImageAnalysis";
import { useLocationData } from "../LocationContext";

const API_BASE = "https://bricsair.onrender.com";

function AIPrediction() {
  const { location, selectedCity } = useLocationData();

  const [prediction, setPrediction] = useState(null);
  const [forecast, setForecast] = useState([]);

  const [loadingPrediction, setLoadingPrediction] =
    useState(true);

  const [loadingForecast, setLoadingForecast] =
    useState(true);

  const [predictionError, setPredictionError] =
    useState("");

  const city = selectedCity || "bengaluru";

  // ============================================
  // AI PREDICTION
  // ============================================
  useEffect(() => {
    async function loadPrediction() {
      setLoadingPrediction(true);
      setPredictionError("");

      try {
        const url =
          `${API_BASE}/api/prediction?city=${encodeURIComponent(city)}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Prediction API error: ${response.status}`
          );
        }

        const data = await response.json();

        setPrediction(data);
      } catch (error) {
        console.error(
          "Prediction frontend error:",
          error
        );

        setPredictionError(
          error.message ||
            "Unable to load AI prediction."
        );
      } finally {
        setLoadingPrediction(false);
      }
    }

    loadPrediction();
  }, [city]);

  // ============================================
  // FORECAST
  // ============================================
  useEffect(() => {
    async function loadForecast() {
      setLoadingForecast(true);

      try {
        const latitude =
          Number(location?.latitude) || 12.9716;

        const longitude =
          Number(location?.longitude) || 77.5946;

        const response = await fetch(
          `${API_BASE}/api/forecast?lat=${latitude}&lon=${longitude}`
        );

        if (!response.ok) {
          throw new Error(
            `Forecast API error: ${response.status}`
          );
        }

        const data = await response.json();

        setForecast(data.forecast || []);
      } catch (error) {
        console.error(
          "Forecast frontend error:",
          error
        );

        setForecast([]);
      } finally {
        setLoadingForecast(false);
      }
    }

    loadForecast();
  }, [
    location?.latitude,
    location?.longitude,
  ]);

  return (
    <div className="ai-page">

      {/* ====================================== */}
      {/* PAGE HEADER */}
      {/* ====================================== */}

      <div className="ai-page-header">

        <div>
          <div className="ai-eyebrow">
            MACHINE LEARNING • AIR INTELLIGENCE
          </div>

          <h1>
            AI & Prediction
          </h1>

          <p>
            Machine learning powered insights for
            understanding and predicting air pollution.
          </p>
        </div>

        <div className="ai-location-badge">
          <span>📍</span>

          <div>
            <small>SELECTED LOCATION</small>

            <strong>
              {location?.name || "Bengaluru"}
            </strong>
          </div>
        </div>

      </div>

      {/* ====================================== */}
      {/* MAIN PREDICTION CARD */}
      {/* ====================================== */}

      <section className="ai-prediction-card">

        <div className="ai-card-top">

          <div>
            <span className="ai-card-label">
              RANDOM FOREST MODEL
            </span>

            <h2>
              🧠 Next-Hour PM2.5 Prediction
            </h2>

            <p>
              Estimated particulate matter concentration
              for the next hour.
            </p>
          </div>

          <div className="ai-model-badge">
            ● AI ACTIVE
          </div>

        </div>

        {loadingPrediction ? (

          <div className="ai-loading">
            <div className="ai-spinner"></div>

            <p>
              Loading AI prediction...
            </p>
          </div>

        ) : predictionError ? (

          <div className="ai-error">
            ⚠️ {predictionError}
          </div>

        ) : prediction ? (

          <div className="ai-prediction-grid">

            {/* CURRENT */}
            <div className="ai-metric-card">

              <span className="ai-metric-label">
                CURRENT PM2.5
              </span>

              <div className="ai-metric-value">
                {prediction.currentPM25}
              </div>

              <span className="ai-metric-unit">
                µg/m³
              </span>

              <p>
                Current concentration
              </p>

            </div>

            {/* ARROW */}
            <div className="ai-arrow">
              →
            </div>

            {/* PREDICTED */}
            <div className="ai-metric-card ai-predicted-card">

              <span className="ai-metric-label">
                PREDICTED NEXT HOUR
              </span>

              <div className="ai-metric-value">
                {prediction.predictedPM25}
              </div>

              <span className="ai-metric-unit">
                µg/m³
              </span>

              <p>
                Machine learning prediction
              </p>

            </div>

            {/* STATUS */}
            <div className="ai-status-card">

              <span className="ai-metric-label">
                AIR QUALITY STATUS
              </span>

              <div className="ai-status-value">
                <span className="ai-status-dot"></span>

                {prediction.status}
              </div>

              <p>
                Predicted condition
              </p>

            </div>

          </div>

        ) : (

          <div className="ai-empty">
            No prediction data available.
          </div>

        )}

      </section>

      {/* ====================================== */}
      {/* MODEL INFORMATION */}
      {/* ====================================== */}

      <section className="ai-section">

        <div className="ai-section-title">

          <div>
            <span>
              MODEL DETAILS
            </span>

            <h2>
              ⚙️ Prediction Model
            </h2>
          </div>

          <p>
            Information about the AI prediction system
          </p>

        </div>

        <div className="ai-model-grid">

          <div className="ai-info-card">
            <span>MODEL</span>

            <strong>
              {prediction?.model ||
                "Random Forest"}
            </strong>

            <small>
              Machine learning algorithm
            </small>
          </div>

          <div className="ai-info-card">
            <span>PREDICTION WINDOW</span>

            <strong>
              {prediction?.predictionTime ||
                "Next Hour"}
            </strong>

            <small>
              Forecast horizon
            </small>
          </div>

          <div className="ai-info-card">
            <span>TARGET VARIABLE</span>

            <strong>
              PM2.5
            </strong>

            <small>
              Fine particulate matter
            </small>
          </div>

          <div className="ai-info-card">
            <span>LOCATION</span>

            <strong>
              {prediction?.city ||
                location?.name ||
                "Bengaluru"}
            </strong>

            <small>
              Selected monitoring area
            </small>
          </div>

        </div>

      </section>

      {/* ====================================== */}
      {/* FORECAST */}
      {/* ====================================== */}

      <section className="ai-section">

        <div className="ai-section-title">

          <div>
            <span>
              POLLUTION FORECAST
            </span>

            <h2>
              📈 24-Hour Pollution Forecast
            </h2>
          </div>

          <p>
            Forecasted pollution levels for the
            selected location.
          </p>

        </div>

        <div className="ai-forecast-card">

          {loadingForecast ? (

            <div className="ai-loading">
              <div className="ai-spinner"></div>

              <p>
                Loading forecast...
              </p>
            </div>

          ) : forecast.length > 0 ? (

            <ForecastChart
              forecast={forecast}
              location={location}
            />

          ) : (

            <div className="ai-empty">
              Unable to load forecast data.
            </div>

          )}

        </div>

      </section>

      {/* ====================================== */}
      {/* IMAGE ANALYSIS */}
      {/* ====================================== */}

      <section className="ai-section">

        <div className="ai-section-title">

          <div>
            <span>
              COMPUTER VISION
            </span>

            <h2>
              🖼️ AI Pollution Image Analysis
            </h2>
          </div>

          <p>
            Analyze visible pollution using AI.
          </p>

        </div>

        <div className="ai-image-card">

          <div className="ai-image-intro">

            <div className="ai-image-icon">
              ✨
            </div>

            <div>
              <h3>
                Analyze an Environmental Image
              </h3>

              <p>
                Upload an image and let AI identify
                visible pollution indicators.
              </p>
            </div>

          </div>

          <PollutionImageAnalysis />

        </div>

      </section>

    </div>
  );
}

export default AIPrediction;