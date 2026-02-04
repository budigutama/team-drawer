/**
 * Formation Service
 * Handles formation parsing and validation
 */

class FormationService {
  /**
   * Parse formation string into position requirements
   * @param {string} formation - e.g., "3-5-2" or "4-4-2"
   * @returns {Object} Position counts
   */
  parseFormation(formation) {
    const parts = formation.split('-');

    if (parts.length !== 3) {
      throw new Error('Invalid formation format. Expected: DEF-MID-FW (e.g., "4-4-2")');
    }

    const [def, mid, fw] = parts.map(p => parseInt(p, 10));

    if ([def, mid, fw].some(n => isNaN(n) || n < 0)) {
      throw new Error('Formation must contain valid numbers');
    }

    return {
      GK: 1, // Always 1 goalkeeper
      DEF: def,
      MID: mid,
      FW: fw,
      total: 1 + def + mid + fw
    };
  }

  /**
   * Get available formations
   */
  getAvailableFormations() {
    return [
      { value: '3-5-2', label: '3-5-2 (Defensive)', total: 11 },
      { value: '4-4-2', label: '4-4-2 (Balanced)', total: 11 },
      { value: '4-3-3', label: '4-3-3 (Attacking)', total: 11 },
      { value: '3-4-3', label: '3-4-3 (Attacking)', total: 11 },
      { value: '5-3-2', label: '5-3-2 (Very Defensive)', total: 11 },
      { value: '4-5-1', label: '4-5-1 (Defensive)', total: 11 },
      { value: '3-3-4', label: '3-3-4 (Ultra Attacking)', total: 11 },
      // Custom formations for smaller teams
      { value: '2-3-1', label: '2-3-1 (7v7)', total: 7 },
      { value: '2-2-1', label: '2-2-1 (6v6)', total: 6 }
    ];
  }

  /**
   * Validate if enough players for formation
   * @param {Array} participants - Array of participants with posisi_untuk_event
   * @param {string} formation - Formation string
   * @param {number} numTeams - Number of teams
   * @returns {Object} Validation result
   */
  validateParticipants(participants, formation, numTeams) {
    const required = this.parseFormation(formation);
    const totalRequired = required.total * numTeams;

    // Count participants by position
    const countByPosition = participants.reduce((acc, p) => {
      const pos = p.posisiUntukEvent || p.posisi_untuk_event;
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {});

    const errors = [];

    // Check each position
    for (const [pos, count] of Object.entries(required)) {
      if (pos === 'total') continue;

      const needed = count * numTeams;
      const available = countByPosition[pos] || 0;

      if (available < needed) {
        errors.push(`Need ${needed} ${pos} but only have ${available}`);
      }
    }

    // Check total
    if (participants.length < totalRequired) {
      errors.push(`Total players needed: ${totalRequired}, but only have ${participants.length}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      required,
      available: countByPosition,
      totalRequired,
      totalAvailable: participants.length
    };
  }
}

module.exports = new FormationService();
