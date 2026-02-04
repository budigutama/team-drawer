/**
 * Randomizer Service
 * Handles team randomization with database integration
 */

const prisma = require('./database');

class RandomizerService {
  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Randomize teams for an event
   * @param {number} eventId - Event ID
   * @returns {Array} Team assignments
   */
  async randomizeEvent(eventId) {
    // Get event with participants
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          include: {
            player: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const { jumlahTim, jumlahGk, jumlahDef, jumlahMid, jumlahFw } = event;

    // Group participants by position
    const playersByPosition = {
      GK: [],
      DEF: [],
      MID: [],
      FW: []
    };

    event.participants.forEach(p => {
      const pos = p.posisiUntukEvent;
      if (playersByPosition[pos]) {
        playersByPosition[pos].push({
          ...p.player,
          participantId: p.id
        });
      }
    });

    // Initialize teams
    const teams = [];
    const colors = await this.getTeamColors(jumlahTim);

    for (let i = 1; i <= jumlahTim; i++) {
      teams.push({
        teamId: i,
        teamColor: colors[i - 1],
        players: {
          GK: [],
          DEF: [],
          MID: [],
          FW: []
        }
      });
    }

    // Distribute players by pot for fairness
    this.distributeByPot(teams, playersByPosition, 'GK', jumlahGk);
    this.distributeByPot(teams, playersByPosition, 'DEF', jumlahDef);
    this.distributeByPot(teams, playersByPosition, 'MID', jumlahMid);
    this.distributeByPot(teams, playersByPosition, 'FW', jumlahFw);

    return teams;
  }

  /**
   * Distribute players by pot to ensure fairness
   * This maintains the pot-based distribution for balanced teams
   */
  distributeByPot(teams, playersByPosition, position, countPerTeam) {
    const players = playersByPosition[position] || [];

    // Group by skill pot
    const byPot = {};
    players.forEach(p => {
      if (!byPot[p.skillPot]) {
        byPot[p.skillPot] = [];
      }
      byPot[p.skillPot].push(p);
    });

    // Distribute each pot round-robin
    Object.keys(byPot).sort().forEach(pot => {
      const potPlayers = this.shuffleArray(byPot[pot]);
      const teamIndexes = this.shuffleArray(
        Array.from({ length: teams.length }, (_, i) => i)
      );

      potPlayers.forEach((player, idx) => {
        const teamIdx = teamIndexes[idx % teams.length];
        if (teams[teamIdx].players[position].length < countPerTeam) {
          teams[teamIdx].players[position].push(player);
        }
      });
    });
  }

  /**
   * Get team colors from database
   */
  async getTeamColors(numTeams) {
    const colors = await prisma.teamColor.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      take: numTeams
    });

    return this.shuffleArray(colors.map(c => c.colorName));
  }

  /**
   * Save randomized teams to database
   */
  async saveTeamAssignments(eventId, teams) {
    // Delete existing assignments
    await prisma.teamAssignment.deleteMany({
      where: { eventId }
    });

    // Create new assignments
    const assignments = [];

    for (const team of teams) {
      for (const [position, players] of Object.entries(team.players)) {
        for (const player of players) {
          assignments.push({
            eventId,
            playerId: player.id,
            teamNumber: team.teamId,
            teamColor: team.teamColor,
            posisi: position
          });
        }
      }
    }

    await prisma.teamAssignment.createMany({
      data: assignments
    });

    // Update event status
    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'completed' }
    });

    return assignments;
  }
}

module.exports = new RandomizerService();
