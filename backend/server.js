const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { randomize } = require("./randomizer");

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

// Endpoint for login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  fs.readFile(configPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading config file:", err);
      return res.status(500).json({ success: false, error: "Server error." });
    }
    try {
      const config = JSON.parse(data);
      const users = config.users || [];
      const matched = users.find(
        (u) => u.username === username && u.password === password,
      );
      if (matched) {
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    } catch (parseErr) {
      console.error("Error parsing config file:", parseErr);
      return res.status(500).json({ success: false, error: "Server error." });
    }
  });
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

// SPA fallback - serve index.html for all non-API routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
