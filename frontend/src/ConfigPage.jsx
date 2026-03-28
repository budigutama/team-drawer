import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const COLOR_OPTIONS = [
  { value: "", label: "Pilih Warna" },
  { value: "red", label: "Red" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "orange", label: "Orange" },
  { value: "purple", label: "Purple" },
  { value: "pink", label: "Pink" },
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
  { value: "grey", label: "Grey" },
];

function ConfigPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState("");

  const adjustArrayToSize = (arr, size) => {
    if (!arr) return Array(size).fill("");
    if (arr.length < size) {
      return [...arr, ...Array(size - arr.length).fill("")];
    }
    return arr.slice(0, size);
  };

  const adjustPotsToTeamCount = (pots, teamCount) => {
    if (!pots) return [];
    return pots.map((pot) => ({
      ...pot,
      players: Object.fromEntries(
        Object.entries(pot.players).map(([role, players]) => [
          role,
          adjustArrayToSize(players, teamCount),
        ]),
      ),
    }));
  };

  useEffect(() => {
    fetch(`${API_URL}/config`)
      .then((res) => res.json())
      .then((data) => {
        // Ensure clr/gk/pots arrays exist and match team count
        if (data) {
          const teamCount = data.jumlah_tim || 0;
          data.clr = adjustArrayToSize(data.clr, teamCount);
          data.gk = adjustArrayToSize(data.gk, teamCount);
          data.pots = adjustPotsToTeamCount(data.pots, teamCount);
        }
        setConfig(data);
      })
      .catch((err) => {
        console.error("Failed to fetch config:", err);
        setStatus("Error: Could not load configuration.");
      });
  }, []);

  const handleSave = () => {
    return new Promise((resolve, reject) => {
      setStatus("Saving...");
      fetch(`${API_URL}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config, null, 2),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStatus("Config saved successfully!");
            resolve();
          } else {
            setStatus(`Failed to save config: ${data.error}`);
            reject(new Error(data.error));
          }
        })
        .catch((err) => {
          console.error("Failed to save config:", err);
          setStatus("Error saving config.");
          reject(err);
        });
    });
  };

  const handleRandomize = async () => {
    try {
      await handleSave(); // Ensure latest config is saved
      setStatus("Randomizing teams...");

      const response = await fetch(`${API_URL}/randomize`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data?.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      navigate("/results", { state: { teams: data } });
    } catch (err) {
      console.error("Failed to randomize:", err);
      setStatus(`Error during randomization: ${err.message}`);
    }
  };

  const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

  const handleJumlahTimChange = (e) => {
    const newConfig = deepCopy(config);
    const newSize = parseInt(e.target.value, 10) || 0;
    newConfig.jumlah_tim = newSize;

    // Adjust CLR, GK, and pots arrays
    newConfig.clr = adjustArrayToSize(newConfig.clr, newSize);
    newConfig.gk = adjustArrayToSize(newConfig.gk, newSize);
    newConfig.pots = adjustPotsToTeamCount(newConfig.pots, newSize);

    setConfig(newConfig);
  };

  const handleClrChange = (index, value) => {
    const newConfig = deepCopy(config);
    newConfig.clr[index] = value;
    setConfig(newConfig);
  };

  const handleGkChange = (index, value) => {
    const newConfig = deepCopy(config);
    newConfig.gk[index] = value;
    setConfig(newConfig);
  };

  const handlePlayerChange = (potIndex, role, playerIndex, value) => {
    const newConfig = deepCopy(config);
    newConfig.pots[potIndex].players[role][playerIndex] = value;
    setConfig(newConfig);
  };

  if (!config) {
    return <div>Loading configuration...</div>;
  }

  return (
    <div>
      <h2>Configuration</h2>

      <fieldset className="config-section">
        <legend>
          <h3>Team Settings</h3>
        </legend>
        <div>
          <label>Number of Teams: </label>
          <input
            type="number"
            value={config.jumlah_tim}
            min="1"
            onChange={handleJumlahTimChange}
          />
        </div>
        <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
          <div style={{ flex: 1 }}>
            <h4>#CLR (Warna)</h4>
            {config.clr.map((color, index) => (
              <div
                key={`clr-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <select
                  value={color}
                  onChange={(e) => handleClrChange(index, e.target.value)}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    boxSizing: "border-box",
                  }}
                >
                  {COLOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    width: "24px",
                    height: "24px",
                    backgroundColor: color || "#333",
                    borderRadius: "4px",
                    border: "1px solid #555",
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <h4>#GK (Kiper)</h4>
            {config.gk.map((goalkeeper, index) => (
              <input
                key={`gk-${index}`}
                type="text"
                value={goalkeeper}
                placeholder={`Kiper Tim ${index + 1}`}
                onChange={(e) => handleGkChange(index, e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  marginBottom: "0.5rem",
                  padding: "0.5rem",
                  height: "33px",
                }}
              />
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="config-section">
        <legend>
          <h3>Player Pots</h3>
        </legend>
        <div className="pots-container">
          {config.pots.map((pot, potIndex) => (
            <div key={potIndex} className="pot-card">
              <h3>{pot.name}</h3>
              <div>
                {Object.entries(pot.players)
                  .filter(([role]) => role !== "#CLR" && role !== "#GK")
                  .map(([role, players]) => (
                    <div key={role} className="role-section">
                      <h4>{role}</h4>
                      {players.map((player, playerIndex) => (
                        <input
                          key={playerIndex}
                          type="text"
                          value={player}
                          placeholder={`${role} ${playerIndex + 1}`}
                          onChange={(e) =>
                            handlePlayerChange(
                              potIndex,
                              role,
                              playerIndex,
                              e.target.value,
                            )
                          }
                        />
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="actions">
        <button onClick={handleRandomize} className="primary-action">
          Save & Randomize
        </button>
        {status && (
          <p className="status-message">
            <i>{status}</i>
          </p>
        )}
      </div>
    </div>
  );
}

export default ConfigPage;
