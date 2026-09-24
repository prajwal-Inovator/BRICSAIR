import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import Dashboard from "./Dashboard";
import AirQuality from "./pages/AirQuality";
import AIPrediction from "./pages/AIPrediction";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";

import { LocationProvider } from "./LocationContext";

function App() {
  return (
    <BrowserRouter>
      <LocationProvider>
        <div className="app-layout">

          {/* =========================
              SIDE NAVIGATION
          ========================= */}

          <aside className="side-navigation">

            <div className="sidebar-brand">
              <div className="sidebar-logo">🌍</div>

              <div>
                <h1>BRICSense</h1>
                <p>Air Quality Intelligence</p>
              </div>
            </div>

            <div className="sidebar-divider"></div>

            <div className="sidebar-section-title">
              MAIN MENU
            </div>

            <nav className="sidebar-links">

              <NavLink to="/" end>
                <span className="sidebar-icon">🏠</span>
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/air-quality">
                <span className="sidebar-icon">🌫️</span>
                <span>Air Quality</span>
              </NavLink>

              <NavLink to="/ai-prediction">
                <span className="sidebar-icon">🤖</span>
                <span>AI & Prediction</span>
              </NavLink>

              <NavLink to="/analytics">
                <span className="sidebar-icon">📊</span>
                <span>Analytics</span>
              </NavLink>

              <NavLink to="/reports">
                <span className="sidebar-icon">📢</span>
                <span>Reports</span>
              </NavLink>

            </nav>

            <div className="sidebar-bottom">

              <div className="sidebar-divider"></div>

              <div className="sidebar-system">
                <span className="system-dot"></span>

                <div>
                  <strong>System Online</strong>
                  <small>All services running</small>
                </div>
              </div>

              <div className="sidebar-footer">
                <span>BRICSense</span>
                <small>Environmental Intelligence Platform</small>
              </div>

            </div>

          </aside>

          {/* =========================
              MAIN CONTENT
          ========================= */}

          <main className="main-content">

            <Routes>

              <Route
                path="/"
                element={<Dashboard />}
              />

              <Route
                path="/air-quality"
                element={<AirQuality />}
              />

              <Route
                path="/ai-prediction"
                element={<AIPrediction />}
              />

              <Route
                path="/analytics"
                element={<Analytics />}
              />

              <Route
                path="/reports"
                element={<Reports />}
              />

            </Routes>

          </main>

        </div>
      </LocationProvider>
    </BrowserRouter>
  );
}

export default App;