import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "/api";

function EventManagementPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [showEventModal, setShowEventModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formations, setFormations] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [eventFormData, setEventFormData] = useState({
    judul: "",
    tglEvent: "",
    jumlahTim: 2,
    formasi: "4-4-2",
    notes: "",
  });

  const [participantFormData, setParticipantFormData] = useState({
    playerId: "",
    posisiUntukEvent: "DEF",
  });

  useEffect(() => {
    fetchEvents();
    fetchFormations();
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

  const fetchFormations = async () => {
    try {
      const res = await fetch(`${API_URL}/config/formations`);
      const data = await res.json();
      setFormations(data.data || []);
    } catch (err) {
      console.error("Failed to fetch formations:", err);
    }
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
    setEventFormData({
      judul: "",
      tglEvent: new Date().toISOString().slice(0, 16),
      jumlahTim: 2,
      formasi: "4-4-2",
      notes: "",
    });
    setShowEventModal(true);
  };

  const handleEditEventClick = (event) => {
    setEditingEvent(event);
    setEventFormData({
      judul: event.judul,
      tglEvent: new Date(event.tglEvent).toISOString().slice(0, 16),
      jumlahTim: event.jumlahTim,
      formasi: event.formasi,
      notes: event.notes || "",
    });
    setShowEventModal(true);
  };

  const handleEventSubmit = async (e) => {
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
        body: JSON.stringify(eventFormData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save event");
      }

      setMessage(editingEvent ? "Event updated successfully" : "Event created successfully");
      setShowEventModal(false);
      fetchEvents();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete event");
      }

      setMessage("Event deleted successfully");
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
      console.error("Failed to fetch participants:", err);
      setMessage("Error loading participants");
    }
    setLoading(false);
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!participantFormData.playerId) {
      setMessage("Please select a player");
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to add participant");
      }

      setMessage("Participant added successfully");
      setParticipantFormData({ playerId: "", posisiUntukEvent: "DEF" });

      // Refresh participants
      const res2 = await fetch(`${API_URL}/events/${selectedEvent.id}/participants`);
      const data2 = await res2.json();
      setParticipants(data2.data || []);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!confirm("Remove this participant?")) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/events/${selectedEvent.id}/participants/${participantId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Failed to remove participant");
      }

      setMessage("Participant removed successfully");

      // Refresh participants
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to randomize teams");
      }

      // Navigate to results page
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
      if (counts[p.posisiUntukEvent] !== undefined) {
        counts[p.posisiUntukEvent]++;
      }
    });
    return counts;
  };

  return (
    <div>
      <h2>Event Management</h2>

      {/* Status Filter */}
      <fieldset className="config-section">
        <legend><h3>Filter</h3></legend>
        <div>
          <label>Status: </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </fieldset>

      {/* Add New Event Button */}
      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <button onClick={handleAddEventClick} className="primary-action">
          + Create New Event
        </button>
      </div>

      {/* Message */}
      {message && <p style={{ color: "#646cff", fontStyle: "italic" }}>{message}</p>}

      {/* Loading State */}
      {loading && <p>Loading...</p>}

      {/* Events List */}
      <div className="events-grid">
        {events.map((event) => (
          <div key={event.id} className="event-card">
            <h3>{event.judul}</h3>
            <p><strong>Date:</strong> {formatDate(event.tglEvent)}</p>
            <p><strong>Teams:</strong> {event.jumlahTim} | <strong>Formation:</strong> {event.formasi}</p>
            <p><strong>Status:</strong> <span style={{ textTransform: "capitalize" }}>{event.status}</span></p>
            <p><strong>Participants:</strong> {event._count?.participants || 0}</p>
            {event.notes && <p><em>{event.notes}</em></p>}
            <div className="event-actions">
              <button onClick={() => handleEditEventClick(event)}>Edit</button>
              <button onClick={() => handleManageParticipants(event)}>Participants</button>
              <button
                onClick={() => handleRandomizeTeams(event.id)}
                className="primary-action"
                disabled={(event._count?.participants || 0) === 0}
              >
                Randomize
              </button>
              <button onClick={() => handleDeleteEvent(event.id)} style={{ backgroundColor: "#555" }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && !loading && (
        <p style={{ textAlign: "center", color: "#aaa", marginTop: "2rem" }}>
          No events found. Click "Create New Event" to create one.
        </p>
      )}

      {/* Add/Edit Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingEvent ? "Edit Event" : "Create New Event"}</h3>
            <form onSubmit={handleEventSubmit}>
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  value={eventFormData.judul}
                  onChange={(e) => setEventFormData({ ...eventFormData, judul: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Event Date *</label>
                <input
                  type="datetime-local"
                  value={eventFormData.tglEvent}
                  onChange={(e) => setEventFormData({ ...eventFormData, tglEvent: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Number of Teams *</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={eventFormData.jumlahTim}
                  onChange={(e) => setEventFormData({ ...eventFormData, jumlahTim: parseInt(e.target.value, 10) })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Formation *</label>
                <select
                  value={eventFormData.formasi}
                  onChange={(e) => setEventFormData({ ...eventFormData, formasi: e.target.value })}
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
                  value={eventFormData.notes}
                  onChange={(e) => setEventFormData({ ...eventFormData, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEventModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={loading}>
                  {editingEvent ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Participants Modal */}
      {showParticipantsModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowParticipantsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px" }}>
            <h3>Manage Participants - {selectedEvent.judul}</h3>

            {/* Add Participant Form */}
            <fieldset className="config-section" style={{ marginBottom: "1rem" }}>
              <legend><h4>Add Participant</h4></legend>
              <form onSubmit={handleAddParticipant}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                  <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    <label>Player</label>
                    <select
                      value={participantFormData.playerId}
                      onChange={(e) => setParticipantFormData({ ...participantFormData, playerId: e.target.value })}
                    >
                      <option value="">Select Player</option>
                      {availablePlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.nama} ({player.posisiDefault} - Pot {player.skillPot})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Position</label>
                    <select
                      value={participantFormData.posisiUntukEvent}
                      onChange={(e) => setParticipantFormData({ ...participantFormData, posisiUntukEvent: e.target.value })}
                    >
                      <option value="GK">GK</option>
                      <option value="DEF">DEF</option>
                      <option value="MID">MID</option>
                      <option value="FW">FW</option>
                    </select>
                  </div>
                  <button type="submit" className="primary-action" disabled={loading}>
                    Add
                  </button>
                </div>
              </form>
            </fieldset>

            {/* Participant Summary */}
            {selectedEvent && (
              <div className="participant-summary" style={{
                backgroundColor: "#2a2a2a",
                padding: "0.75rem",
                borderRadius: "6px",
                marginBottom: "1rem"
              }}>
                <strong>Required:</strong>{" "}
                GK: {getParticipantCountsByPosition().GK}/{selectedEvent.jumlahGk * selectedEvent.jumlahTim} |{" "}
                DEF: {getParticipantCountsByPosition().DEF}/{selectedEvent.jumlahDef * selectedEvent.jumlahTim} |{" "}
                MID: {getParticipantCountsByPosition().MID}/{selectedEvent.jumlahMid * selectedEvent.jumlahTim} |{" "}
                FW: {getParticipantCountsByPosition().FW}/{selectedEvent.jumlahFw * selectedEvent.jumlahTim}
              </div>
            )}

            {/* Current Participants List */}
            <div>
              <h4>Current Participants ({participants.length})</h4>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="participant-item"
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
                        Position: {p.posisiUntukEvent} | Pot: {p.player.skillPot}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveParticipant(p.id)}
                      style={{ backgroundColor: "#555", padding: "0.3rem 0.6rem" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {participants.length === 0 && (
                <p style={{ textAlign: "center", color: "#aaa", padding: "2rem" }}>
                  No participants yet. Add players above.
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowParticipantsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventManagementPage;
