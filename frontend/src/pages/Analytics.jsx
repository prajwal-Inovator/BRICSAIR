import { useEffect, useState } from "react";
import AdvancedAnalytics from "../AdvancedAnalytics";

function Analytics() {
  const [air, setAir] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://bricsair.onrender.com/api/air-quality?city=bengaluru")
      .then((response) => response.json())
      .then((data) => {
        console.log("ANALYTICS DATA:", data);
        setAir(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-container">

      <h1>📊 Analytics</h1>

      <p>
        Analyze pollution levels, hotspots, and citizen reports.
      </p>

      {loading ? (
        <p>Loading pollution data...</p>
      ) : (
        <AdvancedAnalytics air={air} />
      )}

    </div>
  );
}

export default Analytics;