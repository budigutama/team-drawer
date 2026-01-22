import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";

const API_URL = "https://team-drawer-production.up.railway.app/api";

// --- Constants ---
const positionDisplayNames = {
  "#CLR": "WARNA",
  "#GK": "KIPER",
  "#DEF": "Defender",
  "#MID": "Midfield",
  "#FW": "Forward",
};
const positionOrder = ["#GK", "#DEF", "#MID", "#FW"];

// --- Main Component ---
function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("");
  const [teams, setTeams] = useState(location.state?.teams);
  const [isRandomizing, setIsRandomizing] = useState(false);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleRandomizeAgain = async () => {
    setIsRandomizing(true);
    setStatus("Randomizing...");

    try {
      let finalData = null;

      // Run 5 quick randomizations for animation effect
      for (let i = 0; i < 5; i++) {
        const response = await fetch(`${API_URL}/randomize`, {
          method: "POST",
        });
        const data = await response.json();

        if (!response.ok) {
          const errorMessage =
            data?.error || `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        }

        setTeams(data);
        finalData = data;

        // Wait between iterations (faster at start, slower at end)
        if (i < 7) {
          await delay(300 + i * 200);
        }
      }

      setStatus("");
      setIsRandomizing(false);

      // Update location state with final result
      navigate(location.pathname, {
        state: { teams: finalData },
        replace: true,
      });
    } catch (err) {
      console.error("Failed to randomize:", err);
      setStatus(`Error: ${err.message}`);
      setIsRandomizing(false);
    }
  };

  if (!teams || teams.length === 0) {
    return (
      <div className="centered-message">
        <h2>No results to display.</h2>
        <p>
          Please go to the <Link to="/">Configuration page</Link> to generate
          teams.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Team Drawing Results</h2>
        <div className="header-actions">
          {status && <i className="status-message">{status}</i>}
          <button
            onClick={handleRandomizeAgain}
            className="primary-action"
            disabled={isRandomizing}
          >
            {isRandomizing ? "Randomizing..." : "Randomize Again"}
          </button>
        </div>
      </div>

      <div className="teams-grid">
        {teams.map((team) => {
          const teamColor = team.players["#CLR"]?.[0] || "grey";
          return (
            <div
              key={team.teamId}
              className="team-card"
              style={{ borderTop: `5px solid ${teamColor}` }}
            >
              <h3>
                Team {team.teamId}
                <span
                  className="team-color-badge"
                  style={{ backgroundColor: teamColor }}
                >
                  {teamColor}
                </span>
              </h3>

              <div className="player-list">
                {positionOrder.map((pos) => {
                  const players = team.players[pos];
                  if (!players || players.length === 0) return null;

                  return (
                    <div key={pos} className="role-section">
                      <h4>{positionDisplayNames[pos]}</h4>
                      <ul>
                        {players.map((player, index) => (
                          <li key={index}>{player}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResultsPage;
