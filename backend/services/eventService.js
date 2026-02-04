/**
 * Event Service
 * Handles event CRUD operations
 */

const prisma = require('./database');
const formationService = require('./formationService');

class EventService {
  /**
   * Get all events with pagination
   */
  async getAllEvents(options = {}) {
    const { status, limit = 20, offset = 0 } = options;

    const where = {};
    if (status) {
      where.status = status;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          _count: {
            select: {
              participants: true,
              assignments: true
            }
          }
        },
        orderBy: { tglEvent: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10)
      }),
      prisma.event.count({ where })
    ]);

    return {
      events,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      }
    };
  }

  /**
   * Get event by ID with full details
   */
  async getEventById(id) {
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        participants: {
          include: {
            player: true
          }
        },
        assignments: {
          include: {
            player: true
          },
          orderBy: [
            { teamNumber: 'asc' },
            { posisi: 'asc' }
          ]
        }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Format teams from assignments
    if (event.assignments.length > 0) {
      const teamsMap = {};

      event.assignments.forEach(assignment => {
        if (!teamsMap[assignment.teamNumber]) {
          teamsMap[assignment.teamNumber] = {
            teamNumber: assignment.teamNumber,
            teamColor: assignment.teamColor,
            players: {
              GK: [],
              DEF: [],
              MID: [],
              FW: []
            }
          };
        }

        teamsMap[assignment.teamNumber].players[assignment.posisi].push({
          id: assignment.player.id,
          nama: assignment.player.nama,
          skillPot: assignment.player.skillPot
        });
      });

      event.teams = Object.values(teamsMap);
    }

    return event;
  }

  /**
   * Create new event
   */
  async createEvent(data) {
    // Validate data
    this.validateEventData(data);

    // Parse formation
    const formationData = formationService.parseFormation(data.formasi);

    const event = await prisma.event.create({
      data: {
        judul: data.judul,
        tglEvent: new Date(data.tglEvent),
        jumlahTim: parseInt(data.jumlahTim, 10),
        formasi: data.formasi,
        jumlahGk: formationData.GK,
        jumlahDef: formationData.DEF,
        jumlahMid: formationData.MID,
        jumlahFw: formationData.FW,
        notes: data.notes || null,
        status: 'draft'
      }
    });

    return event;
  }

  /**
   * Update event
   */
  async updateEvent(id, data) {
    // Check if event exists
    await this.getEventById(id);

    // Validate data
    this.validateEventData(data);

    const updateData = {
      notes: data.notes
    };

    if (data.judul) {
      updateData.judul = data.judul;
    }

    if (data.tglEvent) {
      updateData.tglEvent = new Date(data.tglEvent);
    }

    if (data.jumlahTim) {
      updateData.jumlahTim = parseInt(data.jumlahTim, 10);
    }

    if (data.formasi) {
      const formationData = formationService.parseFormation(data.formasi);
      updateData.formasi = data.formasi;
      updateData.jumlahGk = formationData.GK;
      updateData.jumlahDef = formationData.DEF;
      updateData.jumlahMid = formationData.MID;
      updateData.jumlahFw = formationData.FW;
    }

    const event = await prisma.event.update({
      where: { id: parseInt(id, 10) },
      data: updateData
    });

    return event;
  }

  /**
   * Delete event
   */
  async deleteEvent(id) {
    // Check if event exists
    await this.getEventById(id);

    // Delete event (cascade will delete participants and assignments)
    await prisma.event.delete({
      where: { id: parseInt(id, 10) }
    });

    return { success: true };
  }

  /**
   * Add participant to event
   */
  async addParticipant(eventId, playerId, posisiUntukEvent) {
    const event = await this.getEventById(eventId);

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id: parseInt(playerId, 10) }
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Check if already a participant
    const existing = await prisma.eventParticipant.findUnique({
      where: {
        eventId_playerId: {
          eventId: parseInt(eventId, 10),
          playerId: parseInt(playerId, 10)
        }
      }
    });

    if (existing) {
      throw new Error('Player is already a participant in this event');
    }

    const participant = await prisma.eventParticipant.create({
      data: {
        eventId: parseInt(eventId, 10),
        playerId: parseInt(playerId, 10),
        posisiUntukEvent: posisiUntukEvent || player.posisiDefault
      },
      include: {
        player: true
      }
    });

    return participant;
  }

  /**
   * Remove participant from event
   */
  async removeParticipant(eventId, participantId) {
    await prisma.eventParticipant.delete({
      where: { id: parseInt(participantId, 10) }
    });

    return { success: true };
  }

  /**
   * Update participant position
   */
  async updateParticipant(eventId, participantId, posisiUntukEvent) {
    const participant = await prisma.eventParticipant.update({
      where: { id: parseInt(participantId, 10) },
      data: { posisiUntukEvent },
      include: { player: true }
    });

    return participant;
  }

  /**
   * Validate event data
   */
  validateEventData(data) {
    const errors = [];

    if (data.judul !== undefined && (!data.judul || data.judul.trim().length === 0)) {
      errors.push('Judul is required');
    }

    if (data.judul && data.judul.trim().length > 200) {
      errors.push('Judul must be less than 200 characters');
    }

    if (data.jumlahTim !== undefined) {
      const numTeams = parseInt(data.jumlahTim, 10);
      if (isNaN(numTeams) || numTeams < 2 || numTeams > 10) {
        errors.push('Number of teams must be between 2 and 10');
      }
    }

    if (data.formasi) {
      try {
        formationService.parseFormation(data.formasi);
      } catch (error) {
        errors.push(error.message);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}

module.exports = new EventService();
