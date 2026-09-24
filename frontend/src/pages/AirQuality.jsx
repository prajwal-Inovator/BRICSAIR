import { useEffect, useState } from "react";
import Map from "../Map";

const API_BASE = "https://bricsair.onrender.com";

function getStatus(pm25) {
  if (pm25 <= 12) return "Good";
  if (pm25 <= 35) return "Moderate";
  if (pm25 <= 55) return "Unhealthy for Sensitive Groups";
  if (pm25 <= 150) return "Unhealthy";
  return "Very Unhealthy";
}

function AirQuality() {
  const [air, setAir] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadAirQuality() {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE}/api/air-quality?city=bengaluru`
      );

      if (!response.ok) {
        throw new Error("Unable to load air-quality data");
      }

      const data = await response.json();

      console.log("AIR QUALITY DATA:", data);

      setAir(data);
    } catch (error) {
      console.error("Air quality error:", error);
      setError("Unable to load air-quality data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAirQuality();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadAirQuality();
  }

  const hotspots = air?.hotspots || [];

  const firstLocation = hotspots[0] || {};

  const pm25 = Number(firstLocation.pm25 ?? air?.pm25 ?? 0);
  const pm10 = Number(firstLocation.pm10 ?? air?.pm10 ?? 0);
  const no2 = Number(firstLocation.no2 ?? air?.no2 ?? 0);
  const so2 = Number(firstLocation.so2 ?? air?.so2 ?? 0);
  const co = Number(firstLocation.co ?? air?.co ?? 0);
  const o3 = Number(firstLocation.o3 ?? air?.o3 ?? 0);

  const status = getStatus(pm25);

  if (loading) {
    return (
      <div className="page-container">
        <div className="air-loading">
          <h1>🌫️ Air Quality Monitoring</h1>
          <p>Loading live air-quality information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container air-quality-page">

      {/* HEADER */}
      <div className="air-header">
        <div>
          <h1>🌫️ Air Quality Monitoring</h1>
          <p>
            Real-time pollution monitoring and environmental conditions.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "🔄 Refreshing..." : "🔄 Refresh Data"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="air-error">
          ⚠️ {error}
        </div>
      )}

      {/* LOCATION */}
      <section className="air-location-card">
        <div>
          <span>📍 CURRENT MONITORING LOCATION</span>

          <h2>
            {air?.city || "Bengaluru"}
          </h2>

          <p>
            India • Live environmental monitoring
          </p>
        </div>

        <div className="live-indicator">
          <span className="live-dot"></span>
          LIVE DATA
        </div>
      </section>

      {/* MAIN STATUS */}
      <section className="air-status-card">

        <div className="status-main">
          <span>Current Air Quality</span>

          <h2>{status}</h2>

          <p>
            Based on current PM2.5 concentration
          </p>
        </div>

        <div className="main-pm-value">
          <span>PM2.5</span>
          <strong>{pm25.toFixed(1)}</strong>
          <small>µg/m³</small>
        </div>

      </section>

      {/* QUICK POLLUTION CARDS */}
      <section>
        <div className="air-section-title">
          <span>LIVE POLLUTION LEVELS</span>
          <h2>Current Pollutants</h2>
        </div>

        <div className="pollutant-cards">

          <div className="pollutant-card">
            <span>PM2.5</span>
            <strong>{pm25.toFixed(1)}</strong>
            <small>µg/m³</small>
          </div>

          <div className="pollutant-card">
            <span>PM10</span>
            <strong>{pm10.toFixed(1)}</strong>
            <small>µg/m³</small>
          </div>

          <div className="pollutant-card">
            <span>NO₂</span>
            <strong>{no2.toFixed(1)}</strong>
            <small>µg/m³</small>
          </div>

          <div className="pollutant-card">
            <span>SO₂</span>
            <strong>{so2.toFixed(1)}</strong>
            <small>µg/m³</small>
          </div>

          <div className="pollutant-card">
            <span>CO</span>
            <strong>{co.toFixed(1)}</strong>
            <small>µg/m³</small>
          </div>

          <div className="pollutant-card">
            <span>O₃</span>
            <strong>{o3.toFixed(1)}</strong>
            <small>µg/m³</small>
          </div>

        </div>
      </section>

      {/* MAP */}
      <section className="air-feature">

        <div className="air-section-title">
          <span>GEOGRAPHICAL MONITORING</span>
          <h2>🗺️ Live Pollution Map</h2>
          <p>
            View pollution levels across monitoring locations.
          </p>
        </div>

        <div className="air-map-wrapper">
          <Map
            latitude={
              Number(air?.latitude) || 12.9716
            }
            longitude={
              Number(air?.longitude) || 77.5946
            }
            hotspots={hotspots}
          />
        </div>

      </section>

      {/* MONITORING LOCATIONS */}
      <section className="air-feature">

        <div className="air-section-title">
          <span>MONITORING NETWORK</span>
          <h2>📍 Monitoring Locations</h2>
          <p>
            Pollution readings from monitored locations.
          </p>
        </div>

        <div className="monitoring-list">

          {hotspots.length > 0 ? (
            hotspots.map((spot, index) => {
              const spotPM25 = Number(spot.pm25) || 0;
              const spotPM10 = Number(spot.pm10) || 0;

              return (
                <div
                  className="monitoring-card"
                  key={index}
                >

                  <div className="monitoring-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="monitoring-info">
                    <h3>
                      {spot.name || `Monitoring Location ${index + 1}`}
                    </h3>

                    <p>
                      Pollution monitoring station
                    </p>
                  </div>

                  <div className="monitoring-value">
                    <span>PM2.5</span>
                    <strong>
                      {spotPM25.toFixed(1)}
                    </strong>
                    <small>µg/m³</small>
                  </div>

                  <div className="monitoring-value">
                    <span>PM10</span>
                    <strong>
                      {spotPM10.toFixed(1)}
                    </strong>
                    <small>µg/m³</small>
                  </div>

                  <div className="monitoring-status">
                    {getStatus(spotPM25)}
                  </div>

                </div>
              );
            })
          ) : (
            <p>No monitoring locations available.</p>
          )}

        </div>

      </section>

      {/* INFORMATION */}
      <section className="air-info-grid">

        <div className="air-info-card">
          <span>📡 DATA SOURCE</span>
          <strong>OpenWeather</strong>
          <p>
            Live environmental and air-pollution data.
          </p>
        </div>

        <div className="air-info-card">
          <span>🔄 UPDATE</span>
          <strong>Live Refresh</strong>
          <p>
            Use refresh to retrieve the latest readings.
          </p>
        </div>

        <div className="air-info-card">
          <span>📊 ANALYTICS</span>
          <strong>Advanced Analysis</strong>
          <p>
            Detailed pollution charts are available in Analytics.
          </p>
        </div>

      </section>

    </div>
  );
}

export default AirQuality;