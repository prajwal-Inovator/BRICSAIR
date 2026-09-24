import { useEffect, useState } from "react";
import AdvancedAnalytics from "../AdvancedAnalytics";
import { useLocationData } from "../LocationContext";

const API_BASE = "https://bricsair.onrender.com";

function Analytics() {
  const {
    location,
    selectedCity,
    air,
  } = useLocationData();

  const [analyticsAir, setAnalyticsAir] =
    useState(air);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // --------------------------------------------------
  // LOAD CURRENT SELECTED LOCATION
  // --------------------------------------------------

  useEffect(() => {
    async function loadAnalyticsData() {
      try {
        setLoading(true);
        setError("");

        // --------------------------------------------
        // IF A BRICS CITY IS SELECTED
        // --------------------------------------------

        if (selectedCity) {
          const response = await fetch(
            `${API_BASE}/api/air-quality?city=${encodeURIComponent(
              selectedCity
            )}`
          );

          if (!response.ok) {
            throw new Error(
              `Analytics API returned ${response.status}`
            );
          }

          const data =
            await response.json();

          console.log(
            "ANALYTICS DATA:",
            data
          );

          setAnalyticsAir(data);

          return;
        }

        // --------------------------------------------
        // IF A SEARCHED LOCATION IS SELECTED
        // --------------------------------------------

        if (
          location?.latitude &&
          location?.longitude
        ) {
          const response = await fetch(
            `${API_BASE}/api/air-quality-location?lat=${location.latitude}&lon=${location.longitude}`
          );

          if (!response.ok) {
            throw new Error(
              `Location analytics API returned ${response.status}`
            );
          }

          const data =
            await response.json();

          console.log(
            "SEARCHED LOCATION ANALYTICS:",
            data
          );

          setAnalyticsAir({
            ...data,

            city:
              location.name ||
              data.city ||
              "Selected Location",

            hotspots: [
              {
                name:
                  location.name ||
                  "Selected Location",

                latitude:
                  location.latitude,

                longitude:
                  location.longitude,

                pm25: data.pm25,
                pm10: data.pm10,
              },
            ],
          });

          return;
        }

        // --------------------------------------------
        // FALLBACK
        // --------------------------------------------

        setAnalyticsAir(air);

      } catch (error) {
        console.error(
          "Analytics error:",
          error
        );

        setError(
          "Unable to load analytics data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalyticsData();

  }, [
    selectedCity,
    location?.latitude,
    location?.longitude,
  ]);

  return (
    <div className="page-container">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div className="page-header">

        <div>

          <span className="page-eyebrow">
            POLLUTION INTELLIGENCE
          </span>

          <h1>
            📊 Analytics
          </h1>

          <p>
            Analyze pollution levels, hotspots,
            and citizen reports for the selected
            location.
          </p>

        </div>

        {/* CURRENT LOCATION */}

        <div className="feature-location">

          📍{" "}
          {location?.name ||
            analyticsAir?.city ||
            "Selected Location"}

        </div>

      </div>

      {/* ========================================= */}
      {/* LOADING */}
      {/* ========================================= */}

      {loading ? (

        <div className="page-feature">

          <p>
            Loading pollution data for{" "}
            <strong>
              {location?.name ||
                "selected location"}
            </strong>
            ...
          </p>

        </div>

      ) : error ? (

        <div className="error-message">

          ⚠️ {error}

        </div>

      ) : (

        <AdvancedAnalytics
          air={analyticsAir}
          location={location}
        />

      )}

    </div>
  );
}

export default Analytics;