import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "/api";

function EventFormPage({ editingEvent, onSaved, onCancel }) {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    judul: editingEvent?.judul || "",
    tglEvent: editingEvent
      ? new Date(editingEvent.tglEvent).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    jumlahTim: editingEvent?.jumlahTim || 2,
    formasi: editingEvent?.formasi || "4-4-2",
    notes: editingEvent?.notes || "",
  });

  useEffect(() => {
    fetch(`${API_URL}/config/formations`)
      .then((res) => res.json())
      .then((data) => setFormations(data.data || []))
      .catch((err) => console.error("Failed to fetch formations:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const url = editingEvent
        ? `${API_URL}/events/${editingEvent.id}`
        : `${API_URL}/events`;
      const method = editingEvent ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save event");
      onSaved();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>{editingEvent ? "Edit Event" : "Create New Event"}</h2>

      <fieldset className="config-section">
        <legend>
          <h3>Event Details</h3>
        </legend>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Judul Event *</label>
            <input
              type="text"
              value={formData.judul}
              placeholder="Contoh: Futsal 6AM Week 12"
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Tanggal Event *</label>
            <input
              type="datetime-local"
              value={formData.tglEvent}
              onChange={(e) => setFormData({ ...formData, tglEvent: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Jumlah Tim *</label>
            <input
              type="number"
              min="2"
              max="10"
              value={formData.jumlahTim}
              onChange={(e) =>
                setFormData({ ...formData, jumlahTim: parseInt(e.target.value, 10) })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Formasi *</label>
            <select
              value={formData.formasi}
              onChange={(e) => setFormData({ ...formData, formasi: e.target.value })}
              required
            >
              {formations.map((f) => (
                <option key={f.formation} value={f.formation}>
                  {f.formation} ({f.description})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows="3"
              value={formData.notes}
              placeholder="Catatan tambahan (opsional)"
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {message && (
            <p style={{ color: "#f66", fontStyle: "italic" }}>{message}</p>
          )}

          <div className="actions">
            <button type="button" onClick={onCancel} style={{ marginRight: "1rem" }}>
              Batal
            </button>
            <button type="submit" className="primary-action" disabled={loading}>
              {loading ? "Menyimpan..." : editingEvent ? "Update Event" : "Buat Event"}
            </button>
          </div>
        </form>
      </fieldset>
    </div>
  );
}

function EventManagementPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("list"); // "list" | "form"
  const [events, setEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [editingEvent, setEditingEvent] = useState(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [participantFormData, setParticipantFormData] = useState({
    playerId: "",
    posisiUntukEvent: "DEF",
  });

  useEffect(() => {
    fetchEvents();
    fetchPlayers();
  }, [statusFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      const res = await fetch(`${API_URL}/events?${params}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setMessage("Error loading events");
    }
    setLoading(false);
  };

  const fetchPlayers = async () => {
    try {
      const res = await fetch(`${API_URL}/players?isActive=true`);
      const data = await res.json();
      setAvailablePlayers(data.data || []);
    } catch (err) {
      console.error("Failed to fetch players:", err);
    }
  };

  const handleAddEventClick = () => {
    setEditingEvent(null);
    setView("form");
  };

  const handleEditEventClick = (event) => {
    setEditingEvent(event);
    setView("form");
  };

  const handleFormSaved = () => {
    setView("list");
    setEditingEvent(null);
    setMessage(editingEvent ? "Event berhasil diupdate" : "Event berhasil dibuat");
    fetchEvents();
  };

  const handleFormCancel = () => {
    setView("list");
    setEditingEvent(null);
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm("Yakin ingin menghapus event ini?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
      setMessage("Event berhasil dihapus");
      fetchEvents();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleManageParticipants = async (event) => {
    setSelectedEvent(event);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/${event.id}/participants`);
      const data = await res.json();
      setParticipants(data.data || []);
      setShowParticipantsModal(true);
    } catch (err) {
      setMessage("Error loading participants");
    }
    setLoading(false);
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!participantFormData.playerId) {
      setMessage("Pilih player terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/${selectedEvent.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(participantFormData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add participant");
      setParticipantFormData({ playerId: "", posisiUntukEvent: "DEF" });
      const res2 = await fetch(`${API_URL}/events/${selectedEvent.id}/participants`);
      const data2 = await res2.json();
      setParticipants(data2.data || []);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!confirm("Hapus participant ini?")) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/events/${selectedEvent.id}/participants/${participantId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove participant");
      const res2 = await fetch(`${API_URL}/events/${selectedEvent.id}/participants`);
      const data = await res2.json();
      setParticipants(data.data || []);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleRandomizeTeams = async (eventId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/randomize`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to randomize teams");
      navigate("/results", { state: { teams: data.data.teams, fromEvent: true } });
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getParticipantCountsByPosition = () => {
    const counts = { GK: 0, DEF: 0, MID: 0, FW: 0 };
    participants.forEach((p) => {
      if (counts[p.posisiUntukEvent] !== undefined) counts[p.posisiUntukEvent]++;
    });
    return counts;
  };

  if (view === "form") {
    return (
      <EventFormPage
        editingEvent={editingEvent}
        onSaved={handleFormSaved}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div>
      <h2>Event Management</h2>

      <fieldset className="config-section">
        <legend>
          <h3>Filter</h3>
        </legend>
        <div>
          <label>Status: </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </fieldset>

      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <button onClick={handleAddEventClick} className="primary-action">
          + Buat Event Baru
        </button>
      </div>

      {message && <p style={{ color: "#646cff", fontStyle: "italic" }}>{message}</p>}
      {loading && <p>Loading...</p>}

      <div className="events-grid">
        {events.map((event) => (
          <div key={event.id} className="event-card">
            <h3>{event.judul}</h3>
            <p><strong>Tanggal:</strong> {formatDate(event.tglEvent)}</p>
            <p><strong>Tim:</strong> {event.jumlahTim} | <strong>Formasi:</strong> {event.formasi}</p>
            <p><strong>Status:</strong> <span style={{ textTransform: "capitalize" }}>{event.status}</span></p>
            <p><strong>Peserta:</strong> {event._count?.participants || 0}</p>
            {event.notes && <p><em>{event.notes}</em></p>}
            <div className="event-actions">
              <button onClick={() => handleEditEventClick(event)}>Edit</button>
              <button onClick={() => handleManageParticipants(event)}>Peserta</button>
              <button
                onClick={() => handleRandomizeTeams(event.id)}
                className="primary-action"
                disabled={(event._count?.participants || 0) === 0}
              >
                Randomize
              </button>
              <button
                onClick={() => handleDeleteEvent(event.id)}
                style={{ backgroundColor: "#555" }}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && !loading && (
        <p style={{ textAlign: "center", color: "#aaa", marginTop: "2rem" }}>
          Belum ada event. Klik "Buat Event Baru" untuk membuat event.
        </p>
      )}

      {/* Manage Participants Modal */}
      {showParticipantsModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowParticipantsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px" }}>
            <h3>Kelola Peserta - {selectedEvent.judul}</h3>

            <fieldset className="config-section" style={{ marginBottom: "1rem" }}>
              <legend><h4>Tambah Peserta</h4></legend>
              <form onSubmit={handleAddParticipant}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                  <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    <label>Player</label>
                    <select
                      value={participantFormData.playerId}
                      onChange={(e) =>
                        setParticipantFormData({ ...participantFormData, playerId: e.target.value })
                      }
                    >
                      <option value="">Pilih Player</option>
                      {availablePlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.nama} ({player.posisiDefault} - Pot {player.skillPot})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Posisi</label>
                    <select
                      value={participantFormData.posisiUntukEvent}
                      onChange={(e) =>
                        setParticipantFormData({ ...participantFormData, posisiUntukEvent: e.target.value })
                      }
                    >
                      <option value="GK">GK</option>
                      <option value="DEF">DEF</option>
                      <option value="MID">MID</option>
                      <option value="FW">FW</option>
                    </select>
                  </div>
                  <button type="submit" className="primary-action" disabled={loading}>
                    Tambah
                  </button>
                </div>
              </form>
            </fieldset>

            {selectedEvent && (
              <div style={{
                backgroundColor: "#2a2a2a",
                padding: "0.75rem",
                borderRadius: "6px",
                marginBottom: "1rem",
              }}>
                <strong>Kebutuhan:</strong>{" "}
                GK: {getParticipantCountsByPosition().GK}/{selectedEvent.jumlahGk * selectedEvent.jumlahTim} |{" "}
                DEF: {getParticipantCountsByPosition().DEF}/{selectedEvent.jumlahDef * selectedEvent.jumlahTim} |{" "}
                MID: {getParticipantCountsByPosition().MID}/{selectedEvent.jumlahMid * selectedEvent.jumlahTim} |{" "}
                FW: {getParticipantCountsByPosition().FW}/{selectedEvent.jumlahFw * selectedEvent.jumlahTim}
              </div>
            )}

            <div>
              <h4>Peserta ({participants.length})</h4>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {participants.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "#333",
                      padding: "0.5rem 1rem",
                      borderRadius: "4px",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div>
                      <strong>{p.player.nama}</strong>
                      <span style={{ marginLeft: "1rem", color: "#aaa" }}>
                        Posisi: {p.posisiUntukEvent} | Pot: {p.player.skillPot}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveParticipant(p.id)}
                      style={{ backgroundColor: "#555", padding: "0.3rem 0.6rem" }}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
              {participants.length === 0 && (
                <p style={{ textAlign: "center", color: "#aaa", padding: "2rem" }}>
                  Belum ada peserta. Tambahkan player di atas.
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowParticipantsModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventManagementPage;
