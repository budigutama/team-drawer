import { Routes, Route, Link } from "react-router-dom";
import "./App.css";
import ConfigPage from "./ConfigPage";
import ResultsPage from "./ResultsPage";

function App() {
  return (
    <>
      <header>
        <h1>Team Drawer</h1>
        <nav>
          <Link to="/">Configuration</Link>
          <Link to="/results">Results</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<ConfigPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
