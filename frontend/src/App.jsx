import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import "./App.css";
import ConfigPage from "./ConfigPage";
import ResultsPage from "./ResultsPage";
import LoginPage from "./LoginPage";

function ProtectedRoute({ children }) {
  const isAuthenticated = sessionStorage.getItem("authenticated") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      {!isLoginPage && (
        <header>
          <h1>Team Drawer</h1>
          <nav>
            <Link to="/">Configuration</Link>
            <Link to="/results">Results</Link>
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
