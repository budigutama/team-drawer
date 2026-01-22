// Randomization logic (ported from Go)

const posList = ["#CLR", "#GK", "#DEF", "#MID", "#FW"];

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomize(config) {
  const { jumlah_tim, clr, gk, pots } = config;

  if (!jumlah_tim || jumlah_tim <= 0) {
    throw new Error("jumlah_tim must be greater than 0");
  }

  // Initialize teams
  const teamsMap = {};
  for (let i = 1; i <= jumlah_tim; i++) {
    teamsMap[i] = {};
    for (const pos of posList) {
      teamsMap[i][pos] = [];
    }
  }

  // Distribute players from pots
  for (const pot of pots) {
    for (const [pos, players] of Object.entries(pot.players)) {
      if (pos === "#CLR" || pos === "#GK") {
        continue; // Skip CLR/GK in pots
      }

      // Shuffle players from this pot/position
      const shuffledPlayers = shuffleArray(players);

      // Create shuffled team indexes
      let teamIndexes = [];
      for (let i = 1; i <= jumlah_tim; i++) {
        teamIndexes.push(i);
      }
      teamIndexes = shuffleArray(teamIndexes);

      // Assign each player to a unique team
      for (let i = 0; i < shuffledPlayers.length && i < teamIndexes.length; i++) {
        const teamId = teamIndexes[i];
        teamsMap[teamId][pos].push(shuffledPlayers[i]);
      }
    }
  }

  // Shuffle and assign CLR and GK from config
  const shuffledClr = shuffleArray(clr || []);
  const shuffledGk = shuffleArray(gk || []);

  for (let i = 1; i <= jumlah_tim; i++) {
    if (shuffledClr.length >= i && shuffledClr[i - 1]) {
      teamsMap[i]["#CLR"].push(shuffledClr[i - 1]);
    }
    if (shuffledGk.length >= i && shuffledGk[i - 1]) {
      teamsMap[i]["#GK"].push(shuffledGk[i - 1]);
    }
  }

  // Format final result
  const finalTeams = [];
  for (let i = 1; i <= jumlah_tim; i++) {
    finalTeams.push({
      teamId: i,
      players: teamsMap[i],
    });
  }

  return finalTeams;
}

module.exports = { randomize };
