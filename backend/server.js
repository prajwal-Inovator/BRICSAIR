const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const dotenv = require("dotenv");
const https = require("https");
const { spawn } = require("child_process");
const path = require("path");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = 5000;

const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST"],
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});
app.set("trust proxy", 1);
app.use("/api", apiLimiter);
// =====================================================
// IMAGE UPLOAD CONFIGURATION
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, JPEG, PNG and WEBP images are allowed."
        )
      );
    }
  },
});

const API_KEY = process.env.OPENWEATHER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn("WARNING: OPENWEATHER_API_KEY is not configured.");
}

if (!GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not configured.");
}
function isValidLatitude(value) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

// =====================================================
// GEMINI AI CLIENT
// =====================================================

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

// =====================================================
// OPENWEATHER REQUEST
// =====================================================

function openWeatherRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        family: 4,
        timeout: 15000,
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            const json = JSON.parse(data);

            if (response.statusCode >= 400) {
              reject(
                new Error(
                  json.message ||
                    `OpenWeather error ${response.statusCode}`
                )
              );
              return;
            }

            resolve(json);
          } catch (error) {
            reject(
              new Error("Invalid response from OpenWeather")
            );
          }
        });
      }
    );

    request.on("timeout", () => {
      request.destroy();

      reject(
        new Error(
          "Connection to OpenWeather timed out after 15 seconds"
        )
      );
    });

    request.on("error", (error) => {
      reject(error);
    });
  });
}

// =====================================================
// BASIC ROUTES
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "BRICSense backend is running",
    status: "online",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    server: "BRICSense backend",
    gemini: GEMINI_API_KEY ? "configured" : "not configured",
  });
});

// =====================================================
// GEMINI AI ENVIRONMENTAL ASSISTANT
// =====================================================

app.post("/api/ai-assistant", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "Gemini AI is not configured",
        details:
          "Please add GEMINI_API_KEY to the backend .env file.",
      });
    }

    const {
      question,
      location,
      airQuality,
      weather,
      prediction,
    } = req.body;

    if (!question || !String(question).trim()) {
      return res.status(400).json({
        error: "Please enter a question.",
      });
    }

    const safeLocation = location || {};
    const safeAir = airQuality || {};
    const safeWeather = weather || {};
    const safePrediction = prediction || {};

    const prompt = `
You are BRICSense AI, an environmental intelligence assistant.

Your job is to help users understand air quality, pollution,
weather, PM2.5, PM10, environmental conditions, and the
pollution data shown by the BRICSense application.

Answer in simple language suitable for a university student.

Do not invent measurements or environmental data.
Use the provided application data when relevant.

CURRENT LOCATION:
Name: ${safeLocation.name || "Unknown"}
State: ${safeLocation.state || "Unknown"}
Country: ${safeLocation.country || "Unknown"}
Latitude: ${safeLocation.latitude ?? "Unknown"}
Longitude: ${safeLocation.longitude ?? "Unknown"}

CURRENT AIR QUALITY:
AQI: ${safeAir.aqi ?? "Unknown"}
Status: ${safeAir.status || "Unknown"}
PM2.5: ${safeAir.pm25 ?? "Unknown"} µg/m³
PM10: ${safeAir.pm10 ?? "Unknown"} µg/m³
NO2: ${safeAir.no2 ?? "Unknown"} µg/m³
CO: ${safeAir.co ?? "Unknown"} µg/m³
SO2: ${safeAir.so2 ?? "Unknown"} µg/m³
O3: ${safeAir.o3 ?? "Unknown"} µg/m³

CURRENT WEATHER:
Temperature: ${safeWeather.temperature ?? "Unknown"} °C
Feels Like: ${safeWeather.feelsLike ?? "Unknown"} °C
Humidity: ${safeWeather.humidity ?? "Unknown"} %
Wind Speed: ${safeWeather.windSpeed ?? "Unknown"} m/s
Pressure: ${safeWeather.pressure ?? "Unknown"} hPa
Condition: ${safeWeather.condition || "Unknown"}
Description: ${safeWeather.description || "Unknown"}

AI PM2.5 PREDICTION:
Current PM2.5: ${safePrediction.currentPM25 ?? "Unknown"} µg/m³
Predicted PM2.5: ${safePrediction.predictedPM25 ?? "Unknown"} µg/m³
Prediction Status: ${safePrediction.status || "Unknown"}
Prediction Model: ${safePrediction.model || "Unknown"}

USER QUESTION:
${String(question).trim()}

Instructions:
1. Answer the user's question directly.
2. Keep the answer concise and useful.
3. Explain technical pollution terms when necessary.
4. If discussing the current location, use the supplied measurements.
5. If supplied data is unavailable, clearly say that it is unavailable.
6. Do not claim that a measurement is exact if the data is unavailable.
7. Do not diagnose medical conditions.
8. For health-related pollution questions, provide general safety information
   and recommend following official local health guidance.
`;

    let response;

    // First Gemini attempt
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
          systemInstruction:
            "You are BRICSense AI, a helpful environmental intelligence assistant.",
          temperature: 0.4,
          maxOutputTokens: 500,
        },
      });
    } catch (firstError) {
      console.error(
        "Gemini first attempt failed:",
        firstError.message
      );

      // Wait 3 seconds before retry
      await new Promise((resolve) =>
        setTimeout(resolve, 3000)
      );

      // Second attempt
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: prompt,
          config: {
            systemInstruction:
              "You are BRICSense AI, a helpful environmental intelligence assistant.",
            temperature: 0.4,
            maxOutputTokens: 500,
          },
        });
      } catch (secondError) {
        console.error(
          "Gemini retry failed:",
          secondError.message
        );

        return res.status(503).json({
          error:
            "Gemini AI is temporarily unavailable. Please try again in a few seconds.",
        });
      }
    }

    const answer =
      response.text ||
      "No answer was received from Gemini.";

    res.json({
      answer,
      model: "Gemini",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gemini AI error:", error);

    res.status(500).json({
      error: "Gemini AI request failed",
      
    });
  }
});

// =====================================================
// INDIAN LOCATION SEARCH
// =====================================================

app.get("/api/search-location", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        error: "Please enter a location",
      });
    }

    const aliases = {
      ballary: "Ballari, Karnataka, India",
      bellary: "Ballari, Karnataka, India",
      bangalore: "Bengaluru, Karnataka, India",
      bengaluru: "Bengaluru, Karnataka, India",
      mysore: "Mysuru, Karnataka, India",
      mysuru: "Mysuru, Karnataka, India",
      mangalore: "Mangaluru, Karnataka, India",
      mangaluru: "Mangaluru, Karnataka, India",
      hubli: "Hubballi, Karnataka, India",
      hubballi: "Hubballi, Karnataka, India",
      belgaum: "Belagavi, Karnataka, India",
      belagavi: "Belagavi, Karnataka, India",
      tumkur: "Tumakuru, Karnataka, India",
      tumakuru: "Tumakuru, Karnataka, India",
    };

    const normalizedQuery = query.toLowerCase();

    const searchQuery =
      aliases[normalizedQuery] || `${query}, India`;

    const url =
      `https://api.openweathermap.org/geo/1.0/direct` +
      `?q=${encodeURIComponent(searchQuery)}` +
      `&limit=5` +
      `&appid=${API_KEY}`;

    const data = await openWeatherRequest(url);

    const locations = (data || [])
      .filter((item) => item.country === "IN")
      .map((item) => ({
        name: item.name,
        state: item.state || "",
        country: item.country,
        latitude: item.lat,
        longitude: item.lon,
      }));

    res.json({
      query,
      count: locations.length,
      locations,
    });
  } catch (error) {
    console.error("Location search error:", error);

    res.status(500).json({
      error: "Unable to search location",
      
    });
  }
});

// =====================================================
// AIR QUALITY FOR ANY LOCATION
// =====================================================

app.get("/api/air-quality-location", async (req, res) => {
  try {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lon);

    if (
  !isValidLatitude(latitude) ||
  !isValidLongitude(longitude)
) {
      return res.status(400).json({
        error: "Valid latitude and longitude are required",
      });
    }

    const url =
      `https://api.openweathermap.org/data/2.5/air_pollution` +
      `?lat=${latitude}` +
      `&lon=${longitude}` +
      `&appid=${API_KEY}`;

    const data = await openWeatherRequest(url);

    if (!data.list || !data.list.length) {
      throw new Error("No air-quality data available");
    }

    const item = data.list[0];
    const components = item.components || {};

    const aqi = item.main?.aqi ?? null;

    const statusMap = {
      1: "Good",
      2: "Fair",
      3: "Moderate",
      4: "Poor",
      5: "Very Poor",
    };

    res.json({
      latitude,
      longitude,

      timestamp: item.dt
        ? new Date(item.dt * 1000).toISOString()
        : new Date().toISOString(),

      aqi,

      status: statusMap[aqi] || "Unknown",

      pm25: components.pm2_5 ?? null,
      pm10: components.pm10 ?? null,
      no2: components.no2 ?? null,
      co: components.co ?? null,
      so2: components.so2 ?? null,
      o3: components.o3 ?? null,
      no: components.no ?? null,
      nh3: components.nh3 ?? null,

      source: "OpenWeather Air Pollution API",
    });
  } catch (error) {
    console.error("Location air-quality error:", error);

    res.status(500).json({
      error: "Unable to retrieve air-quality data",
      
    });
  }
});

// =====================================================
// WEATHER
// =====================================================

app.get("/api/weather", async (req, res) => {
  try {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lon);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        error: "Valid latitude and longitude are required",
      });
    }

    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?lat=${latitude}` +
      `&lon=${longitude}` +
      `&appid=${API_KEY}` +
      `&units=metric`;

    const data = await openWeatherRequest(url);

    res.json({
      location: data.name || "Selected Location",
      country: data.sys?.country || "",
      timestamp: new Date().toISOString(),

      temperature: data.main?.temp ?? null,
      feelsLike: data.main?.feels_like ?? null,
      humidity: data.main?.humidity ?? null,
      pressure: data.main?.pressure ?? null,

      windSpeed: data.wind?.speed ?? null,
      windDirection: data.wind?.deg ?? null,

      visibility: data.visibility ?? null,

      condition:
        data.weather?.[0]?.main || "Unknown",

      description:
        data.weather?.[0]?.description || "",

      icon:
        data.weather?.[0]?.icon || "",

      source: "OpenWeather Current Weather API",
    });
  } catch (error) {
    console.error("Weather error:", error);

    res.status(500).json({
      error: "Unable to retrieve weather data",
      
    });
  }
});

// =====================================================
// BRICS CITY DATA
// =====================================================

const cityData = {
  bengaluru: {
    name: "Bengaluru",
    country: "India",
    latitude: 12.9716,
    longitude: 77.5946,

    locations: [
      {
        name: "Electronic City",
        latitude: 12.8452,
        longitude: 77.6602,
      },
      {
        name: "Whitefield",
        latitude: 12.9698,
        longitude: 77.7499,
      },
      {
        name: "Majestic",
        latitude: 12.9763,
        longitude: 77.5713,
      },
      {
        name: "Bengaluru Central",
        latitude: 12.9716,
        longitude: 77.5946,
      },
    ],
  },

  "sao-paulo": {
    name: "São Paulo",
    country: "Brazil",
    latitude: -23.5505,
    longitude: -46.6333,

    locations: [
      {
        name: "Paulista Avenue",
        latitude: -23.5613,
        longitude: -46.6565,
      },
      {
        name: "Moema",
        latitude: -23.601,
        longitude: -46.6658,
      },
      {
        name: "Pinheiros",
        latitude: -23.5676,
        longitude: -46.7019,
      },
      {
        name: "São Paulo Central",
        latitude: -23.5505,
        longitude: -46.6333,
      },
    ],
  },

  moscow: {
    name: "Moscow",
    country: "Russia",
    latitude: 55.7558,
    longitude: 37.6173,

    locations: [
      {
        name: "Arbat",
        latitude: 55.752,
        longitude: 37.5915,
      },
      {
        name: "Sokolniki",
        latitude: 55.7916,
        longitude: 37.6782,
      },
      {
        name: "Zamoskvorechye",
        latitude: 55.7337,
        longitude: 37.6385,
      },
      {
        name: "Moscow Central",
        latitude: 55.7558,
        longitude: 37.6173,
      },
    ],
  },

  beijing: {
    name: "Beijing",
    country: "China",
    latitude: 39.9042,
    longitude: 116.4074,

    locations: [
      {
        name: "Chaoyang",
        latitude: 39.9219,
        longitude: 116.4436,
      },
      {
        name: "Haidian",
        latitude: 39.9593,
        longitude: 116.2981,
      },
      {
        name: "Dongcheng",
        latitude: 39.9288,
        longitude: 116.416,
      },
      {
        name: "Beijing Central",
        latitude: 39.9042,
        longitude: 116.4074,
      },
    ],
  },

  johannesburg: {
    name: "Johannesburg",
    country: "South Africa",
    latitude: -26.2041,
    longitude: 28.0473,

    locations: [
      {
        name: "Sandton",
        latitude: -26.1076,
        longitude: 28.0567,
      },
      {
        name: "Soweto",
        latitude: -26.2485,
        longitude: 27.8546,
      },
      {
        name: "Rosebank",
        latitude: -26.1466,
        longitude: 28.0436,
      },
      {
        name: "Johannesburg Central",
        latitude: -26.2041,
        longitude: 28.0473,
      },
    ],
  },
};

// =====================================================
// BRICS CITIES LIST
// =====================================================

app.get("/api/cities", (req, res) => {
  res.json(
    Object.entries(cityData).map(([key, city]) => ({
      key,
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
    }))
  );
});

// =====================================================
// BRICS AIR QUALITY
// =====================================================

app.get("/api/air-quality", async (req, res) => {
  try {
    const cityKey = String(
      req.query.city || "bengaluru"
    ).toLowerCase();

    const city = cityData[cityKey];

    if (!city) {
      return res.status(404).json({
        error: "City not found",
      });
    }

    const results = await Promise.all(
      city.locations.map(async (location) => {
        const url =
          `https://api.openweathermap.org/data/2.5/air_pollution` +
          `?lat=${location.latitude}` +
          `&lon=${location.longitude}` +
          `&appid=${API_KEY}`;

        const data = await openWeatherRequest(url);

        const item = data.list?.[0];

        if (!item) {
          throw new Error(
            `No data for ${location.name}`
          );
        }

        const components = item.components || {};

        return {
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          aqi: item.main?.aqi ?? null,
          pm25: components.pm2_5 ?? null,
          pm10: components.pm10 ?? null,
          no2: components.no2 ?? null,
          co: components.co ?? null,
          so2: components.so2 ?? null,
          o3: components.o3 ?? null,
        };
      })
    );

    const central =
      results.find(
        (item) => item.name === city.name
      ) ||
      results[results.length - 1];

    const statusMap = {
      1: "Good",
      2: "Fair",
      3: "Moderate",
      4: "Poor",
      5: "Very Poor",
    };

    res.json({
      city: city.name,
      country: city.country,

      latitude: city.latitude,
      longitude: city.longitude,

      aqi: central?.aqi ?? null,

      status:
        statusMap[central?.aqi] || "Unknown",

      pm25: central?.pm25 ?? null,
      pm10: central?.pm10 ?? null,
      no2: central?.no2 ?? null,
      co: central?.co ?? null,
      so2: central?.so2 ?? null,
      o3: central?.o3 ?? null,

      hotspots: results,

      timestamp: new Date().toISOString(),

      source: "OpenWeather Air Pollution API",
    });
  } catch (error) {
    console.error(
      "BRICS air-quality error:",
      error
    );

    res.status(500).json({
      error:
        "Unable to retrieve air-quality data",
      
    });
  }
});

// =====================================================
// AI PREDICTION
// =====================================================

app.get("/api/prediction", async (req, res) => {
  try {
    const cityKey = String(
      req.query.city || "bengaluru"
    ).toLowerCase();

    const city = cityData[cityKey];

    if (!city) {
      return res.status(404).json({
        error: "City not found",
      });
    }

    const location =
      city.locations[city.locations.length - 1];

    const url =
      `https://api.openweathermap.org/data/2.5/air_pollution` +
      `?lat=${location.latitude}` +
      `&lon=${location.longitude}` +
      `&appid=${API_KEY}`;

    const data = await openWeatherRequest(url);

    const components =
      data.list?.[0]?.components || {};

    const pm25 = Number(
      components.pm2_5 || 0
    );

    const pm10 = Number(
      components.pm10 || 0
    );

    const co = Number(
      components.co || 0
    );

    const no2 = Number(
      components.no2 || 0
    );

    const so2 = Number(
      components.so2 || 0
    );

    const o3 = Number(
      components.o3 || 0
    );

    const scriptPath = path.join(
      __dirname,
      "..",
      "ml",
      "predict.py"
    );

    const python = spawn("python", [
      scriptPath,
      pm25,
      pm10,
      co,
      no2,
      so2,
      o3,
    ]);

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("error", (error) => {
      console.error(
        "Python process error:",
        error
      );

      if (!res.headersSent) {
        res.status(500).json({
          error: "Unable to start Python prediction",
          
        });
      }
    });

    python.on("close", (code) => {
      if (code !== 0) {
        console.error(
          "Prediction error:",
          errorOutput
        );

        if (!res.headersSent) {
          return res.status(500).json({
            error: "Prediction failed",
            details: errorOutput,
          });
        }

        return;
      }

      try {
        const prediction =
          JSON.parse(output.trim());

        res.json({
          city: city.name,
          country: city.country,
          currentPM25: pm25,
          predictedPM25:
            prediction.predictedPM25,
          status: prediction.status,
          predictionTime: "Next Hour",
          model: "Random Forest",
        });
      } catch (error) {
        res.status(500).json({
          error:
            "Invalid prediction result",
        });
      }
    });
  } catch (error) {
    console.error(
      "Prediction error:",
      error
    );

    res.status(500).json({
      error:
        "Unable to generate prediction",
      
    });
  }
});

// =====================================================
// LOCATION DASHBOARD
// =====================================================

app.get(
  "/api/location-dashboard",
  async (req, res) => {
    try {
      const latitude = Number(
        req.query.lat
      );

      const longitude = Number(
        req.query.lon
      );

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return res.status(400).json({
          error:
            "Valid latitude and longitude are required",
        });
      }

      const airUrl =
        `https://api.openweathermap.org/data/2.5/air_pollution` +
        `?lat=${latitude}` +
        `&lon=${longitude}` +
        `&appid=${API_KEY}`;

      const weatherUrl =
        `https://api.openweathermap.org/data/2.5/weather` +
        `?lat=${latitude}` +
        `&lon=${longitude}` +
        `&appid=${API_KEY}` +
        `&units=metric`;

      const [air, weather] =
        await Promise.all([
          openWeatherRequest(airUrl),
          openWeatherRequest(weatherUrl),
        ]);

      const airItem = air.list?.[0];

      if (!airItem) {
        throw new Error(
          "No air-quality data available"
        );
      }

      const components =
        airItem.components || {};

      const aqi =
        airItem.main?.aqi ?? null;

      const statusMap = {
        1: "Good",
        2: "Fair",
        3: "Moderate",
        4: "Poor",
        5: "Very Poor",
      };

      res.json({
        location: {
          name:
            weather.name ||
            "Selected Location",

          country:
            weather.sys?.country || "",

          latitude,
          longitude,
        },

        airQuality: {
          aqi,

          status:
            statusMap[aqi] ||
            "Unknown",

          pm25:
            components.pm2_5 ??
            null,

          pm10:
            components.pm10 ??
            null,

          no2:
            components.no2 ??
            null,

          co:
            components.co ??
            null,

          so2:
            components.so2 ??
            null,

          o3:
            components.o3 ??
            null,
        },

        weather: {
          temperature:
            weather.main?.temp ??
            null,

          feelsLike:
            weather.main?.feels_like ??
            null,

          humidity:
            weather.main?.humidity ??
            null,

          pressure:
            weather.main?.pressure ??
            null,

          windSpeed:
            weather.wind?.speed ??
            null,

          windDirection:
            weather.wind?.deg ??
            null,

          condition:
            weather.weather?.[0]?.main ||
            "Unknown",

          description:
            weather.weather?.[0]
              ?.description || "",
        },

        timestamp:
          new Date().toISOString(),

        source: "OpenWeather",
      });
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );

      res.status(500).json({
        error:
          "Unable to load location dashboard",
        
      });
    }
  }
);

// =====================================================
// 24-HOUR POLLUTION FORECAST
// =====================================================

app.get("/api/forecast", async (req, res) => {
  try {
    const latitude = Number(
      req.query.lat
    );

    const longitude = Number(
      req.query.lon
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        error:
          "Valid latitude and longitude are required",
      });
    }

    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&hourly=pm2_5,pm10` +
      `&forecast_hours=24` +
      `&timezone=auto`;

    const forecastData =
      await new Promise(
        (resolve, reject) => {
          const request = https.get(
            url,
            {
              family: 4,
              timeout: 15000,
            },
            (response) => {
              let body = "";

              response.on(
                "data",
                (chunk) => {
                  body += chunk;
                }
              );

              response.on(
                "end",
                () => {
                  try {
                    const json =
                      JSON.parse(body);

                    if (
                      response.statusCode >=
                      400
                    ) {
                      reject(
                        new Error(
                          json.reason ||
                            `Open-Meteo error ${response.statusCode}`
                        )
                      );

                      return;
                    }

                    resolve(json);
                  } catch (error) {
                    reject(
                      new Error(
                        "Invalid response from Open-Meteo"
                      )
                    );
                  }
                }
              );
            }
          );

          request.on("timeout", () => {
            request.destroy();

            reject(
              new Error(
                "Connection to Open-Meteo timed out"
              )
            );
          });

          request.on("error", reject);
        }
      );

    if (!forecastData.hourly) {
      throw new Error(
        "No forecast data available"
      );
    }

    const times =
      forecastData.hourly.time || [];

    const pm25 =
      forecastData.hourly.pm2_5 || [];

    const pm10 =
      forecastData.hourly.pm10 || [];

    const forecast = [];

    for (
      let i = 0;
      i < Math.min(24, times.length);
      i++
    ) {
      forecast.push({
        time: times[i],
        pm25: pm25[i],
        pm10: pm10[i],
      });
    }

    res.json({
      latitude,
      longitude,
      forecast,
      source:
        "Open-Meteo Air Quality API",
    });
  } catch (error) {
    console.error(
      "Forecast error:",
      error
    );

    res.status(500).json({
      error:
        "Unable to retrieve pollution forecast",
      
    });
  }
});
// =====================================================
// POLLUTION IMAGE ANALYSIS
// =====================================================

app.post(
  "/api/analyze-image",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({
          error: "Gemini AI is not configured.",
          details:
            "Please add GEMINI_API_KEY to the backend .env file.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "Please upload an image.",
        });
      }

      const imageBase64 =
        req.file.buffer.toString("base64");

      const prompt = `
You are BRICSense Pollution Image Analysis AI.

Analyze the uploaded environmental image.

Identify visible signs of:
- Air pollution
- Smoke
- Industrial emissions
- Vehicle exhaust
- Dust
- Haze
- Fire or burning
- Construction dust
- Other visible environmental pollution

Give the result in simple language suitable for a university student.

Important:
1. Only describe what is visibly present in the image.
2. Do not invent pollution measurements.
3. Do not claim that the image gives an exact AQI or PM2.5 value.
4. If pollution cannot be determined from the image, clearly say so.
5. Mention possible pollution sources only when visually reasonable.
6. Give simple recommendations.
7. Do not provide medical diagnosis.

Return the answer using this structure:

Pollution Level:
Possible Pollution Source:
Visible Evidence:
Environmental Explanation:
Recommended Action:
Confidence:
`;

      const response =
        await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
                {
                  inlineData: {
                    mimeType: req.file.mimetype,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          config: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        });

      const analysis =
        response.text ||
        "No analysis was received.";

      res.json({
        success: true,
        analysis,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        model: "Gemini",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "Pollution image analysis error:",
        error
      );

      res.status(500).json({
        error:
          "Unable to analyze the image.",
        
      });
    }
  }
);
// =====================================================
// CITIZEN POLLUTION REPORTING
// =====================================================

const citizenReports = [];

app.get("/api/reports", (req, res) => {
  res.json({
    success: true,
    count: citizenReports.length,
    reports: citizenReports,
  });
});

app.post("/api/reports", (req, res) => {
  try {
    const {
      name,
      pollutionType,
      description,
      location,
      latitude,
      longitude,
    } = req.body;

    if (!pollutionType || !description) {
      return res.status(400).json({
        error:
          "Pollution type and description are required.",
      });
    }

    const report = {
      id: Date.now(),
      name: name || "Anonymous",
      pollutionType,
      description,
      location: location || "Unknown location",
      latitude:
        latitude !== undefined
          ? Number(latitude)
          : null,
      longitude:
        longitude !== undefined
          ? Number(longitude)
          : null,
      status: "Submitted",
      createdAt: new Date().toISOString(),
    };

    citizenReports.unshift(report);

    res.status(201).json({
      success: true,
      message: "Pollution report submitted successfully.",
      report,
    });
  } catch (error) {
    console.error(
      "Citizen report error:",
      error
    );

    res.status(500).json({
      error: "Unable to submit pollution report.",
    });
  }
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(
    `BRICSense backend running on http://localhost:${PORT}`
  );

  console.log(
    `Gemini AI: ${
      GEMINI_API_KEY
        ? "configured"
        : "NOT configured"
    }`
  );
});