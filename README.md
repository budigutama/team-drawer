# Team Drawing Application - Go Version

This is a Go conversion of the Python team drawing application for Six A.M. Fun Football.

## Features

- Randomizes players into teams based on their positions
- Supports multiple player pools (pots)
- Generates individual team files and a summary log
- Interactive command-line interface
- Proper error handling and file management

## Project Structure

- `main.go` - Main application logic and user interface
- `player_list.go` - Player data constants
- `go.mod` - Go module definition

## How to Run

### Option 1: Using the Executable (Recommended)
1. Simply double-click `team-drawer.exe` or run it from command line:
   ```bash
   .\team-drawer.exe
   ```

### Option 2: Using Go (if you have Go installed)
1. Make sure you have Go installed (version 1.21 or later)
2. Navigate to the project directory
3. Run the application:
   ```bash
   go run .
   ```

### Building the Executable
If you want to rebuild the executable:
```bash
go build -o team-drawer.exe .
```

## How it Works

1. The application reads player data from constants defined in `player_list.go`
2. Players are organized by position (CLR, GK, DEF, MID, FW)
3. Each position's players are shuffled randomly
4. Players are distributed evenly across teams (default: 3 teams)
5. Results are saved to:
   - `hasil_random.txt` - Summary of all teams
   - `team1.txt`, `team2.txt`, `team3.txt` - Individual team files

## Key Differences from Python Version

- Uses Go's type system for better type safety
- Implements proper error handling
- Uses Go's standard library for file operations
- More structured approach with custom types
- Better memory management with explicit cleanup

## Configuration

You can modify the number of teams by changing the `JmlTim` constant in `player_list.go`.

## Player Data

Player data is organized in pots (Players1, Players2, etc.) with positions marked by `#` symbols:
- `#CLR` - Colors
- `#GK` - Goalkeepers  
- `#DEF` - Defenders
- `#MID` - Midfielders
- `#FW` - Forwards

To add or modify players, edit the constants in `player_list.go`.
