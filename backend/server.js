const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { randomize } = require("./randomizer");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const configPath = path.join(__dirname, "config.json");

app.get("/", (req, res) => {
  res.send("Backend server is running!");
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
