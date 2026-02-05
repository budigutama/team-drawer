const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { randomize } = require("./randomizer");

// Import services
const prisma = require("./services/database");
const playerService = require("./services/playerService");
const eventService = require("./services/eventService");
const formationService = require("./services/formationService");
const randomizerService = require("./services/randomizerService");

const app = express();
const port = process.env.PORT || 3001;

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

const configPath = path.join(__dirname, "config.json");

// Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));

// Endpoint for login (using database)
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.isActive) {
      return res.json({ success: false });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (isValid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    }

    res.json({ success: false });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Server error." });
  }
});

// Endpoint to get the current config
app.get("/api/config", (req, res) => {
  fs.readFile(configPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading config file:", err);
      return res.status(500).json({ error: "Failed to read config file." });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      console.error("Error parsing config file:", parseErr);
      return res.status(500).json({ error: "Failed to parse config file." });
    }
  });
});

// Endpoint to update the config
app.post("/api/config", (req, res) => {
  const newConfig = req.body;
  fs.writeFile(
    configPath,
    JSON.stringify(newConfig, null, 2),
    "utf8",
    (err) => {
      if (err) {
        console.error("Error writing config file:", err);
        return res.status(500).json({ error: "Failed to write config file." });
      }
      res.json({ success: true, message: "Config updated successfully." });
    },
  );
});

// Endpoint to run the randomization
app.post("/api/randomize", (req, res) => {
  fs.readFile(configPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading config file:", err);
      return res.status(500).json({ error: "Failed to read config file." });
    }

    try {
      const config = JSON.parse(data);
      const teams = randomize(config);
      console.log("Randomization completed successfully.");
      res.json(teams);
    } catch (error) {
      console.error("Randomization error:", error);
      return res.status(500).json({
        error: "Failed to randomize teams.",
        details: error.message,
      });
    }
  });
});

// ============================================
// PLAYER ENDPOINTS
// ============================================

// Get all players
app.get("/api/players", async (req, res) => {
  try {
    const players = await playerService.getAllPlayers(req.query);
    res.json({ data: players });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get player by ID
app.get("/api/players/:id", async (req, res) => {
  try {
    const player = await playerService.getPlayerById(req.params.id);
    res.json({ data: player });
  } catch (error) {
    console.error("Error fetching player:", error);
    res.status(404).json({ error: error.message });
  }
});

// Create new player
app.post("/api/players", async (req, res) => {
  try {
    const player = await playerService.createPlayer(req.body);
    res.status(201).json({ data: player });
  } catch (error) {
    console.error("Error creating player:", error);
    res.status(400).json({ error: error.message });
  }
});

// Update player
app.put("/api/players/:id", async (req, res) => {
  try {
    const player = await playerService.updatePlayer(req.params.id, req.body);
    res.json({ data: player });
  } catch (error) {
    console.error("Error updating player:", error);
    res.status(400).json({ error: error.message });
  }
});

// Delete player
app.delete("/api/players/:id", async (req, res) => {
  try {
    await playerService.deletePlayer(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting player:", error);
    res.status(400).json({ error: error.message });
  }
});

// Get player statistics
app.get("/api/players-stats", async (req, res) => {
  try {
    const stats = await playerService.getPlayerStats();
    res.json({ data: stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EVENT ENDPOINTS
// ============================================

// Get all events
app.get("/api/events", async (req, res) => {
  try {
    const result = await eventService.getAllEvents(req.query);
    res.json(result);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get event by ID
app.get("/api/events/:id", async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.json({ data: event });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(404).json({ error: error.message });
  }
});

// Create new event
app.post("/api/events", async (req, res) => {
  try {
    const event = await eventService.createEvent(req.body);
    res.status(201).json({ data: event });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(400).json({ error: error.message });
  }
});

// Update event
app.put("/api/events/:id", async (req, res) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body);
    res.json({ data: event });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(400).json({ error: error.message });
  }
});

// Delete event
app.delete("/api/events/:id", async (req, res) => {
  try {
    await eventService.deleteEvent(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// EVENT PARTICIPANT ENDPOINTS
// ============================================

// Get participants for an event
app.get("/api/events/:id/participants", async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.json({ data: event.participants });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(404).json({ error: error.message });
  }
});

// Add participant to event
app.post("/api/events/:id/participants", async (req, res) => {
  try {
    const { playerId, posisiUntukEvent } = req.body;
    const participant = await eventService.addParticipant(
      req.params.id,
      playerId,
      posisiUntukEvent,
    );
    res.status(201).json({ data: participant });
  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(400).json({ error: error.message });
  }
});

// Update participant position
app.put(
  "/api/events/:eventId/participants/:participantId",
  async (req, res) => {
    try {
      const { posisiUntukEvent } = req.body;
      const participant = await eventService.updateParticipant(
        req.params.eventId,
        req.params.participantId,
        posisiUntukEvent,
      );
      res.json({ data: participant });
    } catch (error) {
      console.error("Error updating participant:", error);
      res.status(400).json({ error: error.message });
    }
  },
);

// Remove participant from event
app.delete(
  "/api/events/:eventId/participants/:participantId",
  async (req, res) => {
    try {
      await eventService.removeParticipant(
        req.params.eventId,
        req.params.participantId,
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing participant:", error);
      res.status(400).json({ error: error.message });
    }
  },
);

// ============================================
// RANDOMIZATION ENDPOINTS
// ============================================

// Randomize teams for an event
app.post("/api/events/:id/randomize", async (req, res) => {
  try {
    const teams = await randomizerService.randomizeEvent(
      parseInt(req.params.id, 10),
    );
    res.json({ data: { teams } });
  } catch (error) {
    console.error("Randomization error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Save randomized teams to history
app.post("/api/events/:id/save-teams", async (req, res) => {
  try {
    const { teams } = req.body;
    const assignments = await randomizerService.saveTeamAssignments(
      parseInt(req.params.id, 10),
      teams,
    );
    res.json({ data: assignments, success: true });
  } catch (error) {
    console.error("Error saving teams:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get saved teams for an event
app.get("/api/events/:id/teams", async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.json({ data: event.teams || [] });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(404).json({ error: error.message });
  }
});

// ============================================
// CONFIGURATION ENDPOINTS
// ============================================

// Get available formations
app.get("/api/config/formations", (req, res) => {
  const formations = formationService.getAvailableFormations();
  res.json({ data: formations });
});

// Get available team colors
app.get("/api/config/colors", async (req, res) => {
  try {
    const colors = await prisma.teamColor.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });
    res.json({ data: colors });
  } catch (error) {
    console.error("Error fetching colors:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get available positions
app.get("/api/config/positions", (req, res) => {
  const positions = [
    { value: "GK", label: "Goalkeeper (GK)" },
    { value: "DEF", label: "Defender (DEF)" },
    { value: "MID", label: "Midfielder (MID)" },
    { value: "FW", label: "Forward (FW)" },
  ];
  res.json({ data: positions });
});

// SPA fallback - serve index.html for all non-API routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Auto-seed default users if DB is empty
async function initDatabase() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("No users found, seeding default users...");
      const defaultUsers = [
        { username: "admin", password: "admin123", role: "admin" },
        { username: "user", password: "user123", role: "user" },
      ];
      for (const u of defaultUsers) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await prisma.user.create({
          data: {
            username: u.username,
            passwordHash: hashedPassword,
            role: u.role,
          },
        });
        console.log(`  User seeded: ${u.username}`);
      }
    }
  } catch (error) {
    console.error("initDatabase error:", error.message);
  }
}

initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
});
