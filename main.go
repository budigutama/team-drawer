package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	mathrand "math/rand"
	"net/http"
	"os"
	"time"
)

// Position mapping
var dcPost = map[string]string{
	"#CLR": "WARNA",
	"#GK":  "KIPER",
	"#DEF": "Defender",
	"#MID": "Midfield",
	"#FW":  "Forward",
}

var posList = []string{"#CLR", "#GK", "#DEF", "#MID", "#FW"}

// --- Structs for Configuration and Results ---

type Config struct {
	JumlahTim int      `json:"jumlah_tim"`
	Clr       []string `json:"clr"`
	Gk        []string `json:"gk"`
	Pots      []Pot    `json:"pots"`
}

type Pot struct {
	Name    string              `json:"name"`
	Players map[string][]string `json:"players"`
}

type Team struct {
	TeamID  int                 `json:"teamId"`
	Players map[string][]string `json:"players"`
}

// --- Main Drawing Logic ---

func loadConfig() (Config, error) {
	var config Config
	configFile, err := os.ReadFile("config.json")
	if err != nil {
		return config, fmt.Errorf("error reading config file: %v", err)
	}

	err = json.Unmarshal(configFile, &config)
	if err != nil {
		return config, fmt.Errorf("error parsing config file: %v", err)
	}

	if config.JumlahTim <= 0 {
		return config, fmt.Errorf("jumlah_tim must be greater than 0")
	}
	return config, nil
}

func sixamDraw(config Config) ([]Team, error) {
	// 1. Aggregate pot players (excluding CLR and GK from pots)
	potPlayers := make(map[string][]string)
	for _, pot := range config.Pots {
		for pos, players := range pot.Players {
			if pos == "#CLR" || pos == "#GK" { // Explicitly skip CLR/GK from pots
				continue
			}
			if _, ok := dcPost[pos]; !ok {
				log.Printf("Warning: Skipping unknown position '%s' in pot '%s'", pos, pot.Name)
				continue
			}
			potPlayers[pos] = append(potPlayers[pos], players...)
		}
	}

	// 2. Shuffle pot players
	rng := mathrand.New(mathrand.NewSource(generateSecureSeed()))
	for pos := range potPlayers {
		shuffleSliceWithRNG(potPlayers[pos], rng)
	}

	// 3. Initialize team structures
	teamsMap := make(map[int]map[string][]string)
	for i := 1; i <= config.JumlahTim; i++ {
		teamsMap[i] = make(map[string][]string)
		for _, pos := range posList {
			teamsMap[i][pos] = []string{} // Ensure all position slices are created
		}
	}

	// 4. Distribute pot players into teams
	// This new logic prevents players from the same pot & position ending up on the same team.
	for _, pot := range config.Pots {
		for pos, players := range pot.Players {
			if pos == "#CLR" || pos == "#GK" {
				continue // Skip CLR/GK in pots, as they are handled separately
			}

			// Shuffle the players from this specific pot/position group
			shuffleSliceWithRNG(players, rng)

			// Create a shuffled list of team indexes to ensure random distribution
			teamIndexes := make([]int, config.JumlahTim)
			for i := 0; i < config.JumlahTim; i++ {
				teamIndexes[i] = i + 1
			}
			rng.Shuffle(len(teamIndexes), func(i, j int) {
				teamIndexes[i], teamIndexes[j] = teamIndexes[j], teamIndexes[i]
			})

			// Assign each player to a unique team for this pot/position combo
			for i, player := range players {
				if i < len(teamIndexes) {
					teamID := teamIndexes[i]
					teamsMap[teamID][pos] = append(teamsMap[teamID][pos], player)
				}
			}
		}
	}

	// 5. Shuffle and assign CLR and GK from the config
	shuffleSliceWithRNG(config.Clr, rng)
	shuffleSliceWithRNG(config.Gk, rng)

	for i := 1; i <= config.JumlahTim; i++ {
		// Assign CLR
		if len(config.Clr) >= i {
			teamsMap[i]["#CLR"] = append(teamsMap[i]["#CLR"], config.Clr[i-1])
		}
		// Assign GK
		if len(config.Gk) >= i {
			teamsMap[i]["#GK"] = append(teamsMap[i]["#GK"], config.Gk[i-1])
		}
	}

	// 6. Format final result structure
	finalTeams := []Team{}
	for i := 1; i <= config.JumlahTim; i++ {
		finalTeams = append(finalTeams, Team{
			TeamID:  i,
			Players: teamsMap[i],
		})
	}

	return finalTeams, nil
}

// --- Randomization Helpers ---

func generateSecureSeed() int64 {
	b := make([]byte, 8)
	_, err := rand.Read(b)
	if err != nil {
		log.Println("crypto/rand failed, falling back to time-based seed")
		return time.Now().UnixNano()
	}
	return int64(b[0]) | int64(b[1])<<8 | int64(b[2])<<16 | int64(b[3])<<24 |
		int64(b[4])<<32 | int64(b[5])<<40 | int64(b[6])<<48 | int64(b[7])<<56
}

func shuffleSliceWithRNG(slice []string, rng *mathrand.Rand) {
	time.Sleep(time.Duration(rng.Intn(5)) * time.Millisecond)
	rng.Shuffle(len(slice), func(i, j int) {
		slice[i], slice[j] = slice[j], slice[i]
	})
}

// --- HTTP Handler ---

func randomizeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	log.Println("Received request to /randomize")

	config, err := loadConfig()
	if err != nil {
		log.Printf("Error loading configuration: %v", err)
		http.Error(w, fmt.Sprintf("Failed to load configuration: %v", err), http.StatusInternalServerError)
		return
	}

	teams, err := sixamDraw(config)
	if err != nil {
		log.Printf("Drawing failed: %v", err)
		http.Error(w, "Drawing process failed", http.StatusInternalServerError)
		return
	}

	log.Println("Drawing completed successfully!")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(teams); err != nil {
		log.Printf("Failed to write JSON response: %v", err)
	}
}

func main() {
	http.HandleFunc("/randomize", randomizeHandler)
	port := "8080"
	log.Printf("Go server starting on port %s...", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
