import { useState } from "react";

const API_BASE = "http://localhost:5000";

function CitizenReport() {
  const [form, setForm] = useState({
    name: "",
    pollutionType: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const getLocation = () => {
  if (!navigator.geolocation) {
    setError("Location is not supported by this browser.");
    return;
  }

  setLocationLoading(true);
  setError("");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude.toFixed(6);
      const longitude = position.coords.longitude.toFixed(6);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );

        if (!response.ok) {
          throw new Error("Location lookup failed.");
        }

        const data = await response.json();
        const address = data.address || {};

        const place =
          address.quarter ||
          address.suburb ||
          address.neighbourhood ||
          address.city ||
          address.town ||
          address.village ||
          "";

        const state = address.state || "";
        const country = address.country || "";

       const locationName =
  [place, state, country]
    .filter(Boolean)
    .join(", ");

setForm((previous) => ({
  ...previous,
  latitude,
  longitude,
  location: locationName || previous.location,
}));

        setForm((previous) => ({
          ...previous,
          latitude,
          longitude,
          location: locationName,
        }));
      } catch (error) {
        console.error("Location lookup error:", error);

        setForm((previous) => ({
          ...previous,
          latitude,
          longitude,
          location: "Selected GPS Location",
        }));
      } finally {
        setLocationLoading(false);
      }
    },
    () => {
      setLocationLoading(false);

      setError(
        "Unable to get your location. Please allow location access or enter the location manually."
      );
    }
  );
};
  const submitReport = async (event) => {
    event.preventDefault();

    setLoading(true);
    setSubmitted(false);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to submit report."
        );
      }

      setSubmitted(true);

      setForm({
        name: "",
        pollutionType: "",
        description: "",
        location: "",
        latitude: "",
        longitude: "",
      });
    } catch (error) {
      console.error("Report submission error:", error);

      setError(
        error.message || "Unable to submit report."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="citizen-report">
      <div className="citizen-report-header">
        <h2>📢 Citizen Pollution Reporting</h2>

        <p>
          Report visible pollution in your area and help
          create better environmental awareness.
        </p>
      </div>

      <form
        className="citizen-report-form"
        onSubmit={submitReport}
      >
        <div className="form-group">
          <label>Your Name</label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
        </div>

        <div className="form-group">
          <label>Pollution Type *</label>

          <select
            name="pollutionType"
            value={form.pollutionType}
            onChange={handleChange}
            required
          >
            <option value="">
              Select pollution type
            </option>

            <option value="Smoke">
              🌫️ Smoke
            </option>

            <option value="Vehicle Pollution">
              🚗 Vehicle Pollution
            </option>

            <option value="Industrial Pollution">
              🏭 Industrial Pollution
            </option>

            <option value="Dust">
              🟤 Dust
            </option>

            <option value="Garbage Burning">
              🔥 Garbage Burning
            </option>

            <option value="Construction Pollution">
              🏗️ Construction Pollution
            </option>

            <option value="Other">
              ⚠️ Other
            </option>
          </select>
        </div>

        <div className="form-group">
          <label>Description *</label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the pollution you observed..."
            rows="5"
            required
          />
        </div>

        <div className="form-group">
          <label>Location</label>

          <input
  type="text"
  name="location"
  value={form.location}
  onChange={handleChange}
  placeholder="Example: Kamalanagara, Bengaluru"
  required
/>
        </div>

        <div className="location-section">
          <button
            type="button"
            className="location-button"
            onClick={getLocation}
            disabled={locationLoading}
          >
            {locationLoading
              ? "📍 Finding Location..."
              : "📍 Use My Location"}
          </button>

          <div className="coordinates">
            {form.latitude && form.longitude ? (
              <>
                <strong>Location:</strong>{" "}
                {form.location}
                <br />
                <strong>Latitude:</strong>{" "}
                {form.latitude}
                <br />
                <strong>Longitude:</strong>{" "}
                {form.longitude}
              </>
            ) : (
              "Location coordinates not selected"
            )}
          </div>
        </div>

        <button
          type="submit"
          className="submit-report-button"
          disabled={loading}
        >
          {loading
            ? "Submitting..."
            : "🚨 Submit Pollution Report"}
        </button>

        {submitted && (
          <div className="report-success">
            ✅ Pollution report submitted successfully!
          </div>
        )}

        {error && (
          <div className="report-error">
            ❌ {error}
          </div>
        )}
      </form>
    </section>
  );
}

export default CitizenReport;