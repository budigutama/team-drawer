import {
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import ConfigPage from "./ConfigPage";
import ResultsPage from "./ResultsPage";
import LoginPage from "./LoginPage";
import PlayerManagementPage from "./PlayerManagementPage";
import EventManagementPage from "./EventManagementPage";

function ProtectedRoute({ children }) {
  const isAuthenticated = sessionStorage.getItem("authenticated") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login";

  const handleLogout = () => {
    sessionStorage.removeItem("authenticated");
    navigate("/login");
  };

  return (
    <>
      {!isLoginPage && (
        <header>
          <div className="header-brand">
            <img
              src="/Logo sixam.png"
              alt="6AM Fun Football"
              className="header-logo"
            />
            <h1>6 AM Fun Football</h1>
          </div>
          <nav>
            <Link to="/">Configuration</Link>
            <Link to="/players">Players</Link>
            <Link to="/events">Events</Link>
            <Link to="/results">Results</Link>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </nav>
        </header>
      )}
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ConfigPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/players"
            element={
              <ProtectedRoute>
                <PlayerManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}

export default App;
