function PollutionAlert({ pm25 }) {
  const value = Number(pm25);

  if (Number.isNaN(value)) {
    return null;
  }

  let level = "";
  let message = "";
  let icon = "";

  if (value <= 12) {
    level = "Good";
    icon = "🟢";
    message =
      "Air quality is good. Outdoor activities can generally be enjoyed normally.";
  } else if (value <= 35) {
    level = "Moderate";
    icon = "🟡";
    message =
      "Air quality is acceptable, but sensitive individuals should consider reducing prolonged outdoor activity.";
  } else if (value <= 55) {
    level = "Unhealthy for Sensitive Groups";
    icon = "🟠";
    message =
      "Sensitive individuals should reduce prolonged outdoor activity and monitor symptoms.";
  } else if (value <= 150) {
    level = "Unhealthy";
    icon = "🔴";
    message =
      "Consider reducing prolonged outdoor activity. Sensitive individuals should avoid strenuous outdoor activity.";
  } else {
    level = "Very Unhealthy";
    icon = "🟣";
    message =
      "Avoid unnecessary outdoor activity and follow local air-quality guidance.";
  }

  return (
    <section className="pollution-alert">

      <div className="alert-icon">
        {icon}
      </div>

      <div className="alert-content">

        <div className="alert-title">
          {level} Air Quality
        </div>

        <div className="alert-pm">
          Current PM2.5:{" "}
          <strong>
            {value.toFixed(1)} µg/m³
          </strong>
        </div>

        <div className="alert-message">
          {message}
        </div>

      </div>

    </section>
  );
}

export default PollutionAlert;