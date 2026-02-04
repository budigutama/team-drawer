import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

function PlayerManagementPage() {
  const [players, setPlayers] = useState([]);
  const [filters, setFilters] = useState({ posisi: "", skillPot: "", search: "" });
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    nama: "",
    noHp: "",
    tglBergabung: "",
    posisiDefault: "",
    skillPot: 1,
  });

  useEffect(() => {
    fetchPlayers();
    fetchStats();
  }, [filters]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.posisi) params.append("posisi", filters.posisi);
      if (filters.skillPot) params.append("skillPot", filters.skillPot);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`${API_URL}/players?${params}`);
      const data = await res.json();
      setPlayers(data.data || []);
    } catch (err) {
      console.error("Failed to fetch players:", err);
      setMessage("Error loading players");
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/players-stats`);
      const data = await res.json();
      setStats(data.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleAddClick = () => {
    setEditingPlayer(null);
    setFormData({
      nama: "",
      noHp: "",
      tglBergabung: new Date().toISOString().split("T")[0],
      posisiDefault: "DEF",
      skillPot: 1,
    });
    setShowModal(true);
  };

  const handleEditClick = (player) => {
    setEditingPlayer(player);
    setFormData({
      nama: player.nama,
      noHp: player.noHp || "",
      tglBergabung: new Date(player.tglBergabung).toISOString().split("T")[0],
      posisiDefault: player.posisiDefault,
      skillPot: player.skillPot,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const url = editingPlayer
        ? `${API_URL}/players/${editingPlayer.id}`
        : `${API_URL}/players`;
      const method = editingPlayer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save player");
      }

      setMessage(editingPlayer ? "Player updated successfully" : "Player created successfully");
      setShowModal(false);
      fetchPlayers();
      fetchStats();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this player?")) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/players/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete player");
      }

      setMessage("Player deleted successfully");
      fetchPlayers();
      fetchStats();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  return (
    <div>
      <h2>Player Management</h2>

      {/* Filters */}
      <fieldset className="config-section">
        <legend><h3>Filters</h3></legend>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <label>Position: </label>
            <select
              value={filters.posisi}
              onChange={(e) => setFilters({ ...filters, posisi: e.target.value })}
            >
              <option value="">All</option>
              <option value="GK">Goalkeeper (GK)</option>
              <option value="DEF">Defender (DEF)</option>
              <option value="MID">Midfielder (MID)</option>
              <option value="FW">Forward (FW)</option>
            </select>
          </div>
          <div>
            <label>Skill Pot: </label>
            <select
              value={filters.skillPot}
              onChange={(e) => setFilters({ ...filters, skillPot: e.target.value })}
            >
              <option value="">All</option>
              <option value="1">Pot 1</option>
              <option value="2">Pot 2</option>
              <option value="3">Pot 3</option>
              <option value="4">Pot 4</option>
              <option value="5">Pot 5</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Search: </label>
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ width: "100%", maxWidth: "300px" }}
            />
          </div>
        </div>
      </fieldset>

      {/* Statistics Summary */}
      {stats && (
        <div className="stats-summary">
          <strong>Statistics:</strong> Total: {stats.total} |{" "}
          {stats.byPosition.map((p) => `${p.posisiDefault}: ${p._count}`).join(" | ")}
        </div>
      )}

      {/* Add New Player Button */}
      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <button onClick={handleAddClick} className="primary-action">
          + Add New Player
        </button>
      </div>

      {/* Message */}
      {message && <p style={{ color: "#646cff", fontStyle: "italic" }}>{message}</p>}

      {/* Loading State */}
      {loading && <p>Loading...</p>}

      {/* Player List */}
      <div className="players-grid">
        {players.map((player) => (
          <div key={player.id} className="player-card">
            <h3>{player.nama}</h3>
            <p><strong>Phone:</strong> {player.noHp || "-"}</p>
            <p><strong>Position:</strong> {player.posisiDefault} | <strong>Pot:</strong> {player.skillPot}</p>
            <p><strong>Joined:</strong> {formatDate(player.tglBergabung)}</p>
            <p><strong>Status:</strong> {player.isActive ? "Active" : "Inactive"}</p>
            <div className="player-actions">
              <button onClick={() => handleEditClick(player)}>Edit</button>
              <button onClick={() => handleDelete(player.id)} style={{ backgroundColor: "#555" }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {players.length === 0 && !loading && (
        <p style={{ textAlign: "center", color: "#aaa", marginTop: "2rem" }}>
          No players found. Click "Add New Player" to create one.
        </p>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingPlayer ? "Edit Player" : "Add New Player"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="08xxxxxxxxxx or +62xxxxxxxxxx"
                  value={formData.noHp}
                  onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Join Date *</label>
                <input
                  type="date"
                  value={formData.tglBergabung}
                  onChange={(e) => setFormData({ ...formData, tglBergabung: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Position *</label>
                <select
                  value={formData.posisiDefault}
                  onChange={(e) => setFormData({ ...formData, posisiDefault: e.target.value })}
                  required
                >
                  <option value="GK">Goalkeeper (GK)</option>
                  <option value="DEF">Defender (DEF)</option>
                  <option value="MID">Midfielder (MID)</option>
                  <option value="FW">Forward (FW)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Skill Pot (1-5) *</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.skillPot}
                  onChange={(e) => setFormData({ ...formData, skillPot: parseInt(e.target.value, 10) })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={loading}>
                  {editingPlayer ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerManagementPage;
