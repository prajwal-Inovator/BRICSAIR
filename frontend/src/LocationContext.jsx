import { createContext, useContext, useState } from "react";

const LocationContext = createContext(null);

const API_BASE = "https://bricsair.onrender.com";

const DEFAULT_LOCATION = {
  name: "Bengaluru",
  state: "Karnataka",
  country: "India",
  latitude: 12.9716,
  longitude: 77.5946,
};

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(DEFAULT_LOCATION);

  const [air, setAir] = useState(null);
  const [weather, setWeather] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [forecast, setForecast] = useState([]);

  const [selectedCity, setSelectedCity] = useState("bengaluru");

  const [hasSelectedLocation, setHasSelectedLocation] =
    useState(false);

  // --------------------------------------------------
  // LOAD 24-HOUR FORECAST
  // --------------------------------------------------
  async function loadForecast(latitude, longitude) {
    try {
      const response = await fetch(
        `${API_BASE}/api/forecast?lat=${latitude}&lon=${longitude}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Forecast API returned ${response.status}`
        );
      }

      const data = await response.json();

      setForecast(data.forecast || []);
    } catch (error) {
      console.error("Forecast unavailable:", error);
      setForecast([]);
    }
  }

  // --------------------------------------------------
  // LOAD SELECTED BRICS CITY
  // --------------------------------------------------
  async function loadCity(cityKey) {
    try {
      console.log("Loading city:", cityKey);

      // ----------------------------------------------
      // AIR QUALITY
      // ----------------------------------------------
      const airResponse = await fetch(
        `${API_BASE}/api/air-quality?city=${encodeURIComponent(
          cityKey
        )}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!airResponse.ok) {
        throw new Error(
          `Air quality API returned ${airResponse.status}`
        );
      }

      const airData = await airResponse.json();

      console.log("Air quality response:", airData);

      const latitude =
        Number(airData.latitude) ||
        Number(airData.lat) ||
        12.9716;

      const longitude =
        Number(airData.longitude) ||
        Number(airData.lon) ||
        77.5946;

      // ----------------------------------------------
      // SAVE AIR QUALITY
      // ----------------------------------------------
      setAir(airData);

      // ----------------------------------------------
      // SAVE LOCATION
      // ----------------------------------------------
      setLocation({
        name: airData.city || cityKey,
        state:
          cityKey === "bengaluru"
            ? "Karnataka"
            : "",
        country: airData.country || "",
        latitude,
        longitude,
      });

      setSelectedCity(cityKey);
      setHasSelectedLocation(true);

      // ----------------------------------------------
      // FORECAST
      // ----------------------------------------------
      await loadForecast(latitude, longitude);

      // ----------------------------------------------
      // WEATHER
      // ----------------------------------------------
      try {
        const weatherResponse = await fetch(
          `${API_BASE}/api/weather?lat=${latitude}&lon=${longitude}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (weatherResponse.ok) {
          const weatherData =
            await weatherResponse.json();

          setWeather(weatherData);
        } else {
          console.log(
            "Weather API returned:",
            weatherResponse.status
          );

          setWeather(null);
        }
      } catch (error) {
        console.error(
          "Weather unavailable:",
          error
        );

        setWeather(null);
      }

      // ----------------------------------------------
      // AI PREDICTION
      // ----------------------------------------------
      try {
        const predictionUrl =
          `${API_BASE}/api/prediction?city=${encodeURIComponent(
            cityKey
          )}`;

        console.log(
          "Prediction request:",
          predictionUrl
        );

        const predictionResponse =
          await fetch(predictionUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          });

        if (!predictionResponse.ok) {
          throw new Error(
            `Prediction API returned ${predictionResponse.status}`
          );
        }

        const predictionData =
          await predictionResponse.json();

        console.log(
          "Prediction response:",
          predictionData
        );

        setPrediction(predictionData);
      } catch (error) {
        console.error(
          "Prediction unavailable:",
          error
        );

        setPrediction(null);
      }

      console.log(
        "City loaded successfully:",
        cityKey
      );
    } catch (error) {
      console.error(
        "Unable to load city:",
        error
      );

      throw error;
    }
  }

  // --------------------------------------------------
  // SEARCH LOCATION
  // --------------------------------------------------
  async function searchLocation(searchText) {
    if (!searchText.trim()) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/search-location?q=${encodeURIComponent(
          searchText
        )}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Location search returned ${response.status}`
        );
      }

      const data = await response.json();

      if (
        !data.locations ||
        data.locations.length === 0
      ) {
        throw new Error("Location not found");
      }

      const result = data.locations[0];

      const latitude = Number(result.latitude);
      const longitude = Number(result.longitude);

      const locationData = {
        name: result.name,
        state: result.state || "",
        country: result.country || "India",
        latitude,
        longitude,
      };

      // ----------------------------------------------
      // SAVE LOCATION
      // ----------------------------------------------
      setLocation(locationData);

      // ----------------------------------------------
      // AIR QUALITY
      // ----------------------------------------------
      const airResponse = await fetch(
        `${API_BASE}/api/air-quality-location?lat=${latitude}&lon=${longitude}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!airResponse.ok) {
        throw new Error(
          `Air quality location returned ${airResponse.status}`
        );
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

      // ----------------------------------------------
      // FORECAST
      // ----------------------------------------------
      await loadForecast(
        latitude,
        longitude
      );

      // ----------------------------------------------
      // WEATHER
      // ----------------------------------------------
      try {
        const weatherResponse = await fetch(
          `${API_BASE}/api/weather?lat=${latitude}&lon=${longitude}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (weatherResponse.ok) {
          const weatherData =
            await weatherResponse.json();

          setWeather(weatherData);
        } else {
          setWeather(null);
        }
      } catch (error) {
        console.error(
          "Weather unavailable:",
          error
        );

        setWeather(null);
      }

      // Prediction is not requested for
      // arbitrary searched locations.
      // ----------------------------------------------
// AI PREDICTION FOR SEARCHED LOCATION
// ----------------------------------------------
try {
  const predictionUrl =
    `${API_BASE}/api/prediction-location?lat=${latitude}&lon=${longitude}`;

  console.log(
    "Prediction request for searched location:",
    predictionUrl
  );

  const predictionResponse =
    await fetch(predictionUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

  if (!predictionResponse.ok) {
    throw new Error(
      `Prediction API returned ${predictionResponse.status}`
    );
  }

  const predictionData =
    await predictionResponse.json();

  console.log(
    "Searched location prediction:",
    predictionData
  );

  setPrediction(predictionData);
} catch (error) {
  console.error(
    "Prediction unavailable for searched location:",
    error
  );

  setPrediction(null);
}

setSelectedCity("");
setHasSelectedLocation(true);

      console.log(
        "Location search successful:",
        locationData
      );
    } catch (error) {
      console.error(
        "Location search failed:",
        error
      );

      throw error;
    }
  }

  // --------------------------------------------------
  // CONTEXT
  // --------------------------------------------------
  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,

        air,
        setAir,

        weather,
        setWeather,

        prediction,
        setPrediction,

        forecast,
        setForecast,

        selectedCity,
        setSelectedCity,

        hasSelectedLocation,
        setHasSelectedLocation,

        loadCity,
        searchLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

// --------------------------------------------------
// CUSTOM HOOK
// --------------------------------------------------
export function useLocationData() {
  return useContext(LocationContext);
}