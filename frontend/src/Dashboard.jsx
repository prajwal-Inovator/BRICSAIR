import { useEffect, useState } from "react";
import Map from "./Map";
import PollutionChart from "./PollutionChart";
import ForecastChart from "./ForecastChart";
import PollutionAlert from "./PollutionAlert";
import CitizenReport from "./CitizenReport";
import AdvancedAnalytics from "./AdvancedAnalytics";
import PollutionImageAnalysis from "./PollutionImageAnalysis";
import "./App.css";

const API_BASE = "http://localhost:5000";

const BRICS_CITIES = [
  {
    key: "bengaluru",
    name: "Bengaluru",
    country: "India",
    flag: "🇮🇳",
  },
  {
    key: "sao-paulo",
    name: "São Paulo",
    country: "Brazil",
    flag: "🇧🇷",
  },
  {
    key: "moscow",
    name: "Moscow",
    country: "Russia",
    flag: "🇷🇺",
  },
  {
    key: "beijing",
    name: "Beijing",
    country: "China",
    flag: "🇨🇳",
  },
  {
    key: "johannesburg",
    name: "Johannesburg",
    country: "South Africa",
    flag: "🇿🇦",
  },
];

function Dashboard() {
  const [selectedCity, setSelectedCity] = useState("bengaluru");

  const [location, setLocation] = useState({
    name: "Bengaluru",
    state: "Karnataka",
    country: "India",
    latitude: 12.9716,
    longitude: 77.5946,
  });

  const [air, setAir] = useState(null);
  const [weather, setWeather] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [forecast, setForecast] = useState([]);

  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState("");

  // AI ASSISTANT
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  async function askAI() {
    if (!aiQuestion.trim()) return;

    try {
      setAiLoading(true);
      setAiError("");
      setAiAnswer("");

      const response = await fetch(
        `${API_BASE}/api/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: aiQuestion,
            location,
            airQuality: air,
            weather,
            prediction,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "AI assistant unavailable"
        );
      }

      setAiAnswer(data.answer || "No answer received.");
    } catch (err) {
      console.error("AI Assistant Error:", err);

      setAiError(
        "Gemini AI is temporarily unavailable. Please try again later."
      );
    } finally {
      setAiLoading(false);
    }
  }

  // FORECAST
  async function loadForecast(latitude, longitude) {
    try {
      const response = await fetch(
        `${API_BASE}/api/forecast?lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        throw new Error("Forecast unavailable");
      }

      const data = await response.json();

      setForecast(data.forecast || []);
    } catch (err) {
      console.log("Forecast unavailable:", err);
      setForecast([]);
    }
  }

  // LOAD BRICS CITY
  async function loadCity(cityKey) {
    try {
      setLoading(true);
      setError("");

      const airResponse = await fetch(
        `${API_BASE}/api/air-quality?city=${cityKey}`
      );

      if (!airResponse.ok) {
        throw new Error("Unable to load air-quality data");
      }

      const airData = await airResponse.json();

      setAir(airData);

      const latitude =
        Number(airData.latitude) ||
        Number(airData.lat) ||
        12.9716;

      const longitude =
        Number(airData.longitude) ||
        Number(airData.lon) ||
        77.5946;

      const cityInfo = BRICS_CITIES.find(
        (city) => city.key === cityKey
      );

      setLocation({
        name:
          cityInfo?.name ||
          airData.city ||
          "Selected Location",

        state:
          cityInfo?.country === "India"
            ? "Karnataka"
            : cityInfo?.country || "",

        country: cityInfo?.country || "",

        latitude,
        longitude,
      });

      await loadForecast(latitude, longitude);

      // WEATHER
      try {
        const weatherResponse = await fetch(
          `${API_BASE}/api/weather?lat=${latitude}&lon=${longitude}`
        );

        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          setWeather(weatherData);
        } else {
          setWeather(null);
        }
      } catch (err) {
        console.log("Weather unavailable:", err);
        setWeather(null);
      }

      // ML PREDICTION
      try {
        const predictionResponse = await fetch(
          `${API_BASE}/api/prediction?city=${cityKey}`
        );

        if (predictionResponse.ok) {
          const predictionData =
            await predictionResponse.json();

          setPrediction(predictionData);
        } else {
          setPrediction(null);
        }
      } catch (err) {
        console.log("Prediction unavailable:", err);
        setPrediction(null);
      }

      setAiAnswer("");
      setAiError("");

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load environmental data. Please check your internet connection."
      );

      setForecast([]);
    } finally {
      setLoading(false);
    }
  }

  // SEARCH LOCATION
  async function searchLocation() {
    if (!searchText.trim()) return;

    try {
      setSearching(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/search-location?q=${encodeURIComponent(
          searchText
        )}`
      );

      if (!response.ok) {
        throw new Error("Location search failed");
      }

      const data = await response.json();

      if (!data.locations || data.locations.length === 0) {
        throw new Error("Location not found");
      }

      const result = data.locations[0];

      const latitude = Number(result.latitude);
      const longitude = Number(result.longitude);

      setLocation({
        name: result.name,
        state: result.state || "",
        country: result.country || "India",
        latitude,
        longitude,
      });

      // AIR QUALITY
      const airResponse = await fetch(
        `${API_BASE}/api/air-quality-location?lat=${latitude}&lon=${longitude}`
      );

      if (!airResponse.ok) {
        throw new Error("Air quality unavailable");
      }

      const airData = await airResponse.json();

      setAir({
        ...airData,

        city: result.name,

        hotspots: [
          {
            name: result.name,
            latitude,
            longitude,
            pm25: airData.pm25,
            pm10: airData.pm10,
          },
        ],
      });

      await loadForecast(latitude, longitude);

      // WEATHER
      try {
        const weatherResponse = await fetch(
          `${API_BASE}/api/weather?lat=${latitude}&lon=${longitude}`
        );

        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          setWeather(weatherData);
        } else {
          setWeather(null);
        }
      } catch (err) {
        console.log("Weather unavailable:", err);
        setWeather(null);
      }

      setPrediction(null);
      setSelectedCity("");

      setAiAnswer("");
      setAiError("");

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);

      setError(
        "Location not found or environmental data could not be loaded."
      );

      setForecast([]);
    } finally {
      setSearching(false);
    }
  }

  // INITIAL LOAD
  useEffect(() => {
    loadCity("bengaluru");
  }, []);

  function handleCityChange(cityKey) {
    setSelectedCity(cityKey);
    loadCity(cityKey);
  }

  // VALUES
  const aqi = air?.aqi ?? "--";
  const status = air?.status || "Unavailable";

  const pm25 = air?.pm25 ?? "--";
  const pm10 = air?.pm10 ?? "--";
  const no2 = air?.no2 ?? "--";

  const temperature = weather?.temperature ?? "--";
  const feelsLike = weather?.feelsLike ?? "--";
  const humidity = weather?.humidity ?? "--";
  const windSpeed = weather?.windSpeed ?? "--";
  const pressure = weather?.pressure ?? "--";

  const alertPM25 =
    air?.hotspots?.length
      ? air.hotspots.reduce(
          (sum, spot) =>
            sum + Number(spot.pm25 || 0),
          0
        ) / air.hotspots.length
      : Number(air?.pm25);

  return (
    <div className="dashboard-app">

      {/* HERO HEADER */}
      <header className="dashboard-hero">

        <div className="dashboard-brand">

          <div className="dashboard-logo">
            🌍
          </div>

          <div>
            <h1>BRICSense</h1>

            <p>
              AI-Powered Environmental Intelligence
            </p>
          </div>

        </div>

        <div className="dashboard-live-status">
          <span className="dashboard-live-dot"></span>
          LIVE MONITORING
        </div>

      </header>


      <main className="dashboard-container">

        {/* WELCOME HEADER */}
        <section className="dashboard-welcome">

          <div>

            <span className="dashboard-eyebrow">
              ENVIRONMENTAL COMMAND CENTER
            </span>

            <h2>
              Monitor your environment
            </h2>

            <p>
              Real-time air quality, weather,
              AI predictions and pollution insights.
            </p>

          </div>

          <div className="dashboard-updated">

            <span>LAST UPDATED</span>

            <strong>
              {lastUpdated || "Loading..."}
            </strong>

          </div>

        </section>


        {/* SEARCH */}
        <section className="dashboard-search-card">

          <div className="dashboard-search-title">

            <span>🔍</span>

            <div>
              <strong>Search Location</strong>

              <p>
                Explore environmental conditions
                for any Indian location.
              </p>
            </div>

          </div>

          <div className="dashboard-search-box">

            <input
              type="text"
              placeholder="Enter city, town or location..."
              value={searchText}
              onChange={(e) =>
                setSearchText(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchLocation();
                }
              }}
            />

            <button
              onClick={searchLocation}
              disabled={searching}
            >
              {searching
                ? "Searching..."
                : "🔍 Search"}
            </button>

          </div>

        </section>


        {/* BRICS CITIES */}
        <section className="dashboard-cities">

          <div className="dashboard-section-heading">

            <div>

              <span>
                BRICS MONITORING NETWORK
              </span>

              <h2>
                🌎 Monitoring Locations
              </h2>

            </div>

            <p>
              Select a supported city
            </p>

          </div>

          <div className="dashboard-city-grid">

            {BRICS_CITIES.map((city) => (

              <button
                key={city.key}
                className={
                  selectedCity === city.key
                    ? "dashboard-city active"
                    : "dashboard-city"
                }
                onClick={() =>
                  handleCityChange(city.key)
                }
              >

                <span className="city-flag">
                  {city.flag}
                </span>

                <span className="city-details">

                  <strong>
                    {city.name}
                  </strong>

                  <small>
                    {city.country}
                  </small>

                </span>

                {selectedCity === city.key && (
                  <span className="city-selected">
                    ✓
                  </span>
                )}

              </button>

            ))}

          </div>

        </section>


        {/* ERROR */}
        {error && (

          <div className="dashboard-error">

            <strong>
              ⚠️ Data unavailable
            </strong>

            <span>
              {error}
            </span>

          </div>

        )}


        {/* LOADING */}
        {loading ? (

          <div className="dashboard-loading">

            <div className="dashboard-loader"></div>

            <h3>
              Loading environmental data...
            </h3>

            <p>
              Connecting to live monitoring services.
            </p>

          </div>

        ) : (

          <>

            {/* LOCATION */}
            <section className="dashboard-location-card">

              <div>

                <span className="dashboard-card-label">
                  CURRENT MONITORING LOCATION
                </span>

                <h2>
                  📍 {location.name}
                </h2>

                <p>
                  {location.state}
                  {location.state && location.country
                    ? ", "
                    : ""}
                  {location.country}
                </p>

              </div>

              <div className="dashboard-coordinates">

                <div>
                  <span>LATITUDE</span>
                  <strong>
                    {Number(
                      location.latitude
                    ).toFixed(5)}
                  </strong>
                </div>

                <div>
                  <span>LONGITUDE</span>
                  <strong>
                    {Number(
                      location.longitude
                    ).toFixed(5)}
                  </strong>
                </div>

              </div>

            </section>


            {/* KPI AIR QUALITY */}
            <section className="dashboard-main-section">

              <div className="dashboard-section-heading">

                <div>

                  <span>
                    LIVE AIR QUALITY
                  </span>

                  <h2>
                    🌫️ Pollution Overview
                  </h2>

                </div>

                <div className="dashboard-status-pill">
                  <span></span>
                  {status}
                </div>

              </div>


              <div className="dashboard-kpi-grid">

                <div className="dashboard-kpi primary">

                  <div className="kpi-icon">
                    🌿
                  </div>

                  <div>
                    <span>Air Quality Index</span>

                    <strong>
                      {aqi}
                    </strong>

                    <small>
                      OpenWeather AQI
                    </small>
                  </div>

                </div>


                <div className="dashboard-kpi">

                  <div className="kpi-icon">
                    💨
                  </div>

                  <div>
                    <span>PM2.5</span>

                    <strong>
                      {pm25}
                    </strong>

                    <small>
                      µg/m³
                    </small>
                  </div>

                </div>


                <div className="dashboard-kpi">

                  <div className="kpi-icon">
                    🌫️
                  </div>

                  <div>
                    <span>PM10</span>

                    <strong>
                      {pm10}
                    </strong>

                    <small>
                      µg/m³
                    </small>
                  </div>

                </div>


                <div className="dashboard-kpi">

                  <div className="kpi-icon">
                    🏭
                  </div>

                  <div>
                    <span>NO₂</span>

                    <strong>
                      {no2}
                    </strong>

                    <small>
                      µg/m³
                    </small>
                  </div>

                </div>

              </div>

              <div className="dashboard-aqi-note">
                OpenWeather AQI scale:
                <strong> 1 = Good</strong>
                {" · "}
                <strong>5 = Very Poor</strong>
              </div>

            </section>


            {/* WEATHER + PREDICTION */}
            <section className="dashboard-two-column">

              {/* WEATHER */}
              <div className="dashboard-panel">

                <div className="dashboard-panel-header">

                  <div>

                    <span>
                      CURRENT CONDITIONS
                    </span>

                    <h2>
                      🌤️ Weather
                    </h2>

                  </div>

                  <div className="panel-icon">
                    {weather?.condition === "Rain"
                      ? "🌧️"
                      : "🌤️"}
                  </div>

                </div>


                <div className="weather-main">

                  <strong>
                    {temperature}°C
                  </strong>

                  <span>
                    {weather?.description ||
                      "Current conditions"}
                  </span>

                </div>


                <div className="weather-details">

                  <div>
                    <span>Feels Like</span>
                    <strong>
                      {feelsLike}°C
                    </strong>
                  </div>

                  <div>
                    <span>Humidity</span>
                    <strong>
                      {humidity}%
                    </strong>
                  </div>

                  <div>
                    <span>Wind</span>
                    <strong>
                      {windSpeed} m/s
                    </strong>
                  </div>

                  <div>
                    <span>Pressure</span>
                    <strong>
                      {pressure} hPa
                    </strong>
                  </div>

                </div>

              </div>


              {/* AI PREDICTION */}
              <div className="dashboard-panel prediction-panel">

                <div className="dashboard-panel-header">

                  <div>

                    <span>
                      MACHINE LEARNING
                    </span>

                    <h2>
                      🤖 AI Prediction
                    </h2>

                  </div>

                  <div className="panel-icon">
                    🧠
                  </div>

                </div>


                {prediction ? (

                  <>

                    <div className="prediction-flow">

                      <div>

                        <span>
                          CURRENT PM2.5
                        </span>

                        <strong>
                          {prediction.currentPM25 ??
                            pm25}
                        </strong>

                        <small>
                          µg/m³
                        </small>

                      </div>

                      <div className="prediction-arrow">
                        →
                      </div>

                      <div className="prediction-highlight">

                        <span>
                          NEXT HOUR
                        </span>

                        <strong>
                          {prediction.predictedPM25 ??
                            "--"}
                        </strong>

                        <small>
                          µg/m³
                        </small>

                      </div>

                    </div>


                    <div className="prediction-footer">

                      <span>
                        Status
                      </span>

                      <strong>
                        {prediction.status ||
                          "Moderate"}
                      </strong>

                      <small>
                        {prediction.model ||
                          "Random Forest"}
                      </small>

                    </div>

                  </>

                ) : (

                  <div className="prediction-unavailable">
                    AI prediction is available
                    for supported BRICS monitoring
                    cities.
                  </div>

                )}

              </div>

            </section>


            {/* SMART ALERT */}
            <PollutionAlert
              pm25={alertPM25}
            />


            {/* MAP */}
            <section className="dashboard-feature-section">

              <div className="dashboard-section-heading">

                <div>

                  <span>
                    GEOGRAPHICAL MONITORING
                  </span>

                  <h2>
                    🗺️ Live Pollution Map
                  </h2>

                </div>

                <p>
                  Monitor pollution hotspots
                  geographically.
                </p>

              </div>


              <div className="dashboard-map-card">

                <Map
                  latitude={location.latitude}
                  longitude={location.longitude}
                  hotspots={air?.hotspots || []}
                />

              </div>

            </section>


            {/* POLLUTION CHART */}
            <section className="dashboard-feature-section">

              <div className="dashboard-section-heading">

                <div>

                  <span>
                    MONITORING ANALYTICS
                  </span>

                  <h2>
                    📊 Pollution Comparison
                  </h2>

                </div>

                <p>
                  Compare PM2.5 and PM10
                  across locations.
                </p>

              </div>


              <div className="dashboard-chart-card">

                <PollutionChart
                  hotspots={air?.hotspots || []}
                />

              </div>

            </section>


            {/* FORECAST */}
            <section className="dashboard-feature-section">

              <div className="dashboard-section-heading">

                <div>

                  <span>
                    AI & ENVIRONMENTAL FORECAST
                  </span>

                  <h2>
                    🔮 24-Hour Pollution Forecast
                  </h2>

                </div>

                <p>
                  Forecasted PM2.5 and PM10 levels.
                </p>

              </div>


              <div className="dashboard-chart-card">

                <ForecastChart
                  forecast={forecast}
                />

              </div>

            </section>


            {/* SMART FEATURES */}
            <section className="dashboard-smart-section">

              <div className="dashboard-section-heading">

                <div>

                  <span>
                    SMART ENVIRONMENT TOOLS
                  </span>

                  <h2>
                    🧠 AI & Citizen Intelligence
                  </h2>

                </div>

                <p>
                  Analyze, understand and report
                  environmental conditions.
                </p>

              </div>


              <div className="dashboard-smart-grid">

                <div className="dashboard-smart-card">

                  <div className="smart-card-icon">
                    📸
                  </div>

                  <h3>
                    Pollution Image Analysis
                  </h3>

                  <p>
                    Upload an image of smoke,
                    dust or haze and analyze
                    visible pollution.
                  </p>

                  <PollutionImageAnalysis />

                </div>


                <div className="dashboard-smart-card">

                  <div className="smart-card-icon">
                    🧠
                  </div>

                  <h3>
                    BRICSense AI Assistant
                  </h3>

                  <p>
                    Ask Gemini about air quality,
                    pollution and environmental
                    conditions.
                  </p>

                  <div className="ai-question-box dashboard-ai-box">

                    <textarea
                      value={aiQuestion}
                      onChange={(e) =>
                        setAiQuestion(e.target.value)
                      }
                      placeholder="Ask about the current environment..."
                      rows="3"
                    />

                    <button
                      onClick={askAI}
                      disabled={
                        aiLoading ||
                        !aiQuestion.trim()
                      }
                    >
                      {aiLoading
                        ? "🤖 Thinking..."
                        : "✨ Ask Gemini"}
                    </button>

                  </div>


                  <div className="ai-suggestions">

                    <button
                      onClick={() =>
                        setAiQuestion(
                          "What does the current air quality mean for people?"
                        )
                      }
                    >
                      💨 Air quality
                    </button>

                    <button
                      onClick={() =>
                        setAiQuestion(
                          "What can I do to reduce my exposure to air pollution?"
                        )
                      }
                    >
                      🛡️ Safety tips
                    </button>

                    <button
                      onClick={() =>
                        setAiQuestion(
                          "Explain the current PM2.5 and PM10 levels in simple language."
                        )
                      }
                    >
                      📊 Explain pollution
                    </button>

                  </div>


                  {aiError && (
                    <div className="ai-error">
                      ⚠️ {aiError}
                    </div>
                  )}


                  {aiAnswer && (
                    <div className="ai-answer">

                      <div className="ai-answer-title">

                        <span>🤖</span>

                        <strong>
                          BRICSense AI
                        </strong>

                      </div>

                      <div className="ai-answer-text">
                        {aiAnswer}
                      </div>

                    </div>
                  )}

                </div>


                <div className="dashboard-smart-card">

                  <div className="smart-card-icon">
                    📢
                  </div>

                  <h3>
                    Citizen Pollution Reporting
                  </h3>

                  <p>
                    Report smoke, dust,
                    construction pollution,
                    garbage burning and other
                    environmental issues.
                  </p>

                  <CitizenReport />

                </div>

              </div>

            </section>


            {/* ANALYTICS */}
            <section className="dashboard-feature-section">

              <div className="dashboard-section-heading">

                <div>

                  <span>
                    DATA INTELLIGENCE
                  </span>

                  <h2>
                    📊 Advanced Analytics
                  </h2>

                </div>

                <p>
                  Analyze pollution levels,
                  hotspots and citizen reports.
                </p>

              </div>


              <div className="dashboard-analytics-card">

                <AdvancedAnalytics air={air} />

              </div>

            </section>


            {/* DATA SOURCES */}
            <section className="dashboard-data-sources">

              <div>
                <span>DATA SOURCE</span>
                <strong>OpenWeather</strong>
              </div>

              <div>
                <span>FORECAST SOURCE</span>
                <strong>Open-Meteo</strong>
              </div>

              <div>
                <span>AI ASSISTANT</span>
                <strong>Google Gemini</strong>
              </div>

              <div>
                <span>ML MODEL</span>
                <strong>Random Forest</strong>
              </div>

              <div>
                <span>PLATFORM</span>
                <strong>BRICSense AI</strong>
              </div>

            </section>

          </>

        )}

      </main>


      <footer className="dashboard-footer">

        <strong>
          🌍 BRICSense
        </strong>

        <span>
          AI-Powered Air Quality &
          Environmental Intelligence
        </span>

        <small>
          Real-time monitoring • AI prediction
          • Environmental insights
        </small>

      </footer>

    </div>
  );
}

export default Dashboard;