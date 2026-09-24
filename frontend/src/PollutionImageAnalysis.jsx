import { useState } from "react";

function PollutionImageAnalysis() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setAnalysis("");
    setError("");
  };

  const analyzeImage = async () => {
    if (!image) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setAnalysis("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch(
        "http://localhost:5000/api/analyze-image",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Image analysis failed."
        );
      }

      setAnalysis(data.analysis || "No analysis available.");
    } catch (error) {
      console.error("Image analysis error:", error);

      setError(
        error.message ||
          "Unable to analyze the image."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="image-analysis">
      <div className="image-analysis-header">
        <h2>📸 Pollution Image Analysis</h2>

        <p>
          Upload an image of smoke, dust, haze, or visible
          pollution and let BRICSense analyze it.
        </p>
      </div>

      <div className="image-analysis-content">
        <label className="image-upload-box">
          <span className="upload-icon">📤</span>

          <span className="upload-text">
            {image
              ? image.name
              : "Choose a pollution image"}
          </span>

          <span className="upload-hint">
            JPG, PNG or WEBP • Maximum 5 MB
          </span>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleImageChange}
          />
        </label>

        {preview && (
          <div className="image-preview">
            <img
              src={preview}
              alt="Pollution preview"
            />
          </div>
        )}

        <button
          className="analyze-image-button"
          onClick={analyzeImage}
          disabled={!image || loading}
        >
          {loading
            ? "🔍 Analyzing..."
            : "🔍 Analyze Pollution"}
        </button>

        {error && (
          <div className="image-analysis-error">
            ❌ {error}
          </div>
        )}

        {analysis && (
          <div className="image-analysis-result">
            <h3>🤖 AI Analysis</h3>

            <div className="analysis-text">
              {analysis.split("\n").map(
                (line, index) => (
                  <p key={index}>
                    {line || "\u00A0"}
                  </p>
                )
              )}
            </div>

            <div className="analysis-note">
              ⚠️ This is an AI-based visual analysis.
              It does not provide an exact AQI or PM2.5
              measurement.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PollutionImageAnalysis;
