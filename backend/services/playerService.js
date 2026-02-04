/**
 * Player Service
 * Handles player CRUD operations
 */

const prisma = require('./database');

class PlayerService {
  /**
   * Get all players with filters
   */
  async getAllPlayers(filters = {}) {
    const { posisi, isActive, skillPot, search } = filters;

    const where = {};

    if (posisi) {
      where.posisiDefault = posisi;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    if (skillPot) {
      where.skillPot = parseInt(skillPot, 10);
    }

    if (search) {
      where.nama = {
        contains: search
      };
    }

    const players = await prisma.player.findMany({
      where,
      orderBy: [
        { skillPot: 'asc' },
        { posisiDefault: 'asc' },
        { nama: 'asc' }
      ]
    });

    return players;
  }

  /**
   * Get player by ID
   */
  async getPlayerById(id) {
    const player = await prisma.player.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!player) {
      throw new Error('Player not found');
    }

    return player;
  }

  /**
   * Create new player
   */
  async createPlayer(data) {
    // Validate data
    this.validatePlayerData(data);

    const player = await prisma.player.create({
      data: {
        nama: data.nama.trim(),
        noHp: data.noHp?.trim() || null,
        tglBergabung: new Date(data.tglBergabung),
        posisiDefault: data.posisiDefault,
        skillPot: data.skillPot || 1,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });

    return player;
  }

  /**
   * Update player
   */
  async updatePlayer(id, data) {
    // Check if player exists
    await this.getPlayerById(id);

    // Validate data
    this.validatePlayerData(data);

    const player = await prisma.player.update({
      where: { id: parseInt(id, 10) },
      data: {
        nama: data.nama?.trim(),
        noHp: data.noHp?.trim() || null,
        tglBergabung: data.tglBergabung ? new Date(data.tglBergabung) : undefined,
        posisiDefault: data.posisiDefault,
        skillPot: data.skillPot,
        isActive: data.isActive
      }
    });

    return player;
  }

  /**
   * Delete player (soft delete)
   */
  async deletePlayer(id) {
    // Check if player exists
    await this.getPlayerById(id);

    // Soft delete by setting isActive to false
    const player = await prisma.player.update({
      where: { id: parseInt(id, 10) },
      data: { isActive: false }
    });

    return player;
  }

  /**
   * Validate player data
   */
  validatePlayerData(data) {
    const errors = [];

    if (data.nama !== undefined && (!data.nama || data.nama.trim().length === 0)) {
      errors.push('Nama is required');
    }

    if (data.posisiDefault && !['GK', 'DEF', 'MID', 'FW'].includes(data.posisiDefault)) {
      errors.push('Invalid position. Must be GK, DEF, MID, or FW');
    }

    if (data.skillPot !== undefined && (data.skillPot < 1 || data.skillPot > 5)) {
      errors.push('Skill pot must be between 1 and 5');
    }

    if (data.noHp && data.noHp.trim() && !/^(08|\+62)\d{8,12}$/.test(data.noHp.trim())) {
      errors.push('Invalid phone number format. Must start with 08 or +62');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  /**
   * Get player statistics
   */
  async getPlayerStats() {
    const total = await prisma.player.count({
      where: { isActive: true }
    });

    const byPosition = await prisma.player.groupBy({
      by: ['posisiDefault'],
      where: { isActive: true },
      _count: true
    });

    const byPot = await prisma.player.groupBy({
      by: ['skillPot'],
      where: { isActive: true },
      _count: true
    });

    return {
      total,
      byPosition,
      byPot
    };
  }
}

module.exports = new PlayerService();
