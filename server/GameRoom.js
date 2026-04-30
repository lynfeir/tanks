const PHASES = {
  LOBBY: 'lobby',
  DRAWING: 'drawing',
  KING_SELECTION: 'king_selection',
  BATTLE: 'battle',
  GAME_OVER: 'game_over',
};

const TANKS_PER_PLAYER = 6;
const NORMAL_HP = 2;
const KING_HP = 1;
const DISCONNECT_GRACE_MS = 90000;
const TURN_DELAY_MS = 4500;

const DEFAULT_DRAWING_TIME = 120;
const ALLOWED_DRAWING_TIMES = new Set([60, 120, 180]);

class GameRoom {
  constructor(roomCode, options = {}) {
    this.roomCode = roomCode;
    this.phase = PHASES.LOBBY;
    this.players = {};
    this.playerOrder = [];
    this.currentTurnIndex = 0;
    this.disconnectTimers = {};
    this.turnTimer = null;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.rollInProgress = false;
    this.spectators = new Set(); // websockets, not players

    // Host-configurable drawing time, validated against allowlist
    const requestedTime = Number(options.drawingTimeSeconds);
    this.drawingTimeSeconds =
      ALLOWED_DRAWING_TIMES.has(requestedTime) ? requestedTime : DEFAULT_DRAWING_TIME;

    // Match analytics counters
    this.matchStartedAt = null;
    this.turnsCompleted = 0;
    this.kingShotsFired = 0;
    this.bonusRollsUsed = 0;
  }

  touch() {
    this.lastActivity = Date.now();
  }

  addPlayer(playerId, playerName, ws) {
    if (this.playerOrder.length >= 2) {
      return { error: 'Room is full' };
    }
    if (this.phase !== PHASES.LOBBY) {
      return { error: 'Game already in progress' };
    }

    this.players[playerId] = {
      id: playerId,
      name: playerName,
      ws,
      tanks: Array.from({ length: TANKS_PER_PLAYER }, (_, i) => ({
        id: i,
        imageUrl: null,
        bulletUrl: null,
        hp: NORMAL_HP,
        isKing: false,
        destroyed: false,
      })),
      drawingsSubmitted: false,
      kingSelected: false,
      connected: true,
      bonusRollsLeft: 1,
    };

    this.playerOrder.push(playerId);
    this.touch();

    if (this.playerOrder.length === 2) {
      this.phase = PHASES.DRAWING;
      this.broadcast('PHASE_CHANGE', {
        phase: PHASES.DRAWING,
        drawingTimeSeconds: this.drawingTimeSeconds,
      });
    }

    return { success: true };
  }

  reconnectPlayer(playerId, ws) {
    const player = this.players[playerId];
    if (!player) return false;
    if (this.phase === PHASES.GAME_OVER) return false;

    if (this.disconnectTimers[playerId]) {
      clearTimeout(this.disconnectTimers[playerId]);
      delete this.disconnectTimers[playerId];
    }

    player.ws = ws;
    player.connected = true;
    this.touch();

    this.broadcastToOthers(playerId, 'PLAYER_RECONNECTED', { playerId });
    this.sendTo(playerId, 'SYNC_STATE', this.getState(playerId));

    return true;
  }

  handleDisconnect(playerId, closedWs) {
    const player = this.players[playerId];
    if (!player) return;
    if (!player.connected) return;
    if (closedWs && player.ws && player.ws !== closedWs) return;

    player.connected = false;
    player.ws = null;

    if (this.phase === PHASES.LOBBY || this.phase === PHASES.GAME_OVER) {
      return;
    }

    this.broadcastToOthers(playerId, 'PLAYER_DISCONNECTED', { playerId });

    if (this.disconnectTimers[playerId]) {
      clearTimeout(this.disconnectTimers[playerId]);
    }

    this.disconnectTimers[playerId] = setTimeout(() => {
      if (this.players[playerId] && !this.players[playerId].connected && this.phase !== PHASES.GAME_OVER) {
        const winnerId = this.playerOrder.find((id) => id !== playerId);
        if (winnerId) {
          this.phase = PHASES.GAME_OVER;
          this.logMatchEnd('disconnect', winnerId);
          this.broadcast('GAME_OVER', {
            winnerId,
            loserId: playerId,
            reason: 'disconnect',
            stats: this.getStats(),
            analytics: this.getMatchAnalytics('disconnect', winnerId),
          });
        }
      }
      delete this.disconnectTimers[playerId];
    }, DISCONNECT_GRACE_MS);
  }

  submitDrawings(playerId, tanks, bullets) {
    if (this.phase !== PHASES.DRAWING) {
      return { error: 'Not in drawing phase' };
    }

    const player = this.players[playerId];
    if (!player) return { error: 'Player not found' };
    if (player.drawingsSubmitted) return { error: 'Already submitted' };
    if (!Array.isArray(tanks) || !Array.isArray(bullets)) {
      return { error: 'Invalid drawing data' };
    }

    for (let i = 0; i < TANKS_PER_PLAYER; i++) {
      player.tanks[i].imageUrl = tanks[i] || null;
      player.tanks[i].bulletUrl = bullets[i] || null;
    }
    player.drawingsSubmitted = true;
    this.touch();

    this.broadcastToOthers(playerId, 'DRAWINGS_RECEIVED', { playerId });

    if (this.allPlayersReady('drawingsSubmitted')) {
      this.phase = PHASES.KING_SELECTION;
      this.broadcast('PHASE_CHANGE', { phase: PHASES.KING_SELECTION });
    }

    return { success: true };
  }

  selectKing(playerId, tankIndex) {
    if (this.phase !== PHASES.KING_SELECTION) {
      return { error: 'Not in king selection phase' };
    }

    const player = this.players[playerId];
    if (!player) return { error: 'Player not found' };
    if (player.kingSelected) return { error: 'Already selected' };
    if (tankIndex < 0 || tankIndex >= TANKS_PER_PLAYER) {
      return { error: 'Invalid tank index' };
    }

    player.tanks.forEach((t, i) => {
      t.isKing = i === tankIndex;
      t.hp = i === tankIndex ? KING_HP : NORMAL_HP;
    });
    player.kingSelected = true;
    this.touch();

    this.broadcastToOthers(playerId, 'KING_SELECTED', { playerId });

    if (this.allPlayersReady('kingSelected')) {
      this.startBattle();
    }

    return { success: true };
  }

  startBattle() {
    if (this.playerOrder.length < 2) return;
    const p1 = this.players[this.playerOrder[0]];
    const p2 = this.players[this.playerOrder[1]];
    if (!p1 || !p2) return;

    this.phase = PHASES.BATTLE;
    this.currentTurnIndex = 0;
    this.matchStartedAt = Date.now();

    for (const pid of this.playerOrder) {
      const oppId = this.playerOrder.find((id) => id !== pid);
      const oppTanks = this.players[oppId].tanks.map((t) => ({
        id: t.id, imageUrl: t.imageUrl, bulletUrl: t.bulletUrl,
        hp: t.hp, isKing: t.isKing, destroyed: t.destroyed,
      }));

      this.sendTo(pid, 'PHASE_CHANGE', {
        phase: PHASES.BATTLE,
        currentTurn: this.playerOrder[this.currentTurnIndex],
        opponentTanks: oppTanks,
        bonusRollsLeft: this.getBonusRollsMap(),
      });
    }
  }

  rollDice(playerId, options = {}) {
    if (this.phase !== PHASES.BATTLE) return { error: 'Not in battle phase' };
    if (this.rollInProgress) return { error: 'Roll in progress' };

    const currentTurnPlayer = this.playerOrder[this.currentTurnIndex];
    if (playerId !== currentTurnPlayer) return { error: 'Not your turn' };

    const attackerId = playerId;
    const defenderId = this.playerOrder.find((id) => id !== playerId);
    const attacker = this.players[attackerId];
    const defender = this.players[defenderId];
    if (!attacker || !defender) return { error: 'Player not found' };

    const aliveTanks = attacker.tanks.filter((t) => !t.destroyed);
    const aliveTargets = defender.tanks.filter((t) => !t.destroyed);
    if (aliveTanks.length === 0 || aliveTargets.length === 0) return { error: 'No valid tanks' };

    // Bonus roll: same roll, but turn doesn't advance afterwards
    const bonusRequested = !!options.useBonus;
    const bonusGranted = bonusRequested && attacker.bonusRollsLeft > 0;
    if (bonusGranted) {
      attacker.bonusRollsLeft -= 1;
      this.bonusRollsUsed += 1;
    }

    this.rollInProgress = true;
    this.turnsCompleted += 1;

    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;

    const shooterTank = aliveTanks[(roll1 - 1) % aliveTanks.length];
    const targetTank = aliveTargets[(roll2 - 1) % aliveTargets.length];

    const isKingShot = shooterTank.isKing;

    if (isKingShot) {
      this.kingShotsFired += 1;
      targetTank.hp = 0;
      targetTank.destroyed = true;
    } else {
      targetTank.hp = Math.max(0, targetTank.hp - 1);
      targetTank.destroyed = targetTank.hp <= 0;
    }

    this.touch();

    this.broadcast('DICE_RESULT', {
      roll1, roll2, attackerId, defenderId,
      shooterTank: shooterTank.id,
      targetTank: targetTank.id,
      isKingShot,
      shooterBulletUrl: shooterTank.bulletUrl,
      bonusUsed: bonusGranted,
      bonusRollsLeft: this.getBonusRollsMap(),
    });

    this.broadcast('TANK_HIT', {
      targetPlayerId: defenderId,
      tankIndex: targetTank.id,
      isKingShot,
      remainingHP: targetTank.hp,
      destroyed: targetTank.destroyed,
    });

    const defenderAlive = defender.tanks.some((t) => !t.destroyed);
    if (!defenderAlive) {
      setTimeout(() => {
        this.rollInProgress = false;
        if (this.phase === PHASES.BATTLE) {
          this.phase = PHASES.GAME_OVER;
          this.logMatchEnd('all_destroyed', attackerId);
          this.broadcast('GAME_OVER', {
            winnerId: attackerId, loserId: defenderId,
            reason: 'all_destroyed', stats: this.getStats(),
            analytics: this.getMatchAnalytics('all_destroyed', attackerId),
          });
        }
      }, TURN_DELAY_MS);
      return { success: true };
    }

    if (this.turnTimer) clearTimeout(this.turnTimer);
    this.turnTimer = setTimeout(() => {
      this.rollInProgress = false;
      if (this.phase === PHASES.BATTLE) {
        // Skip turn advance if this was a bonus roll — same player goes again
        if (!bonusGranted) {
          this.currentTurnIndex = (this.currentTurnIndex + 1) % 2;
        }
        this.broadcast('PHASE_CHANGE', {
          phase: PHASES.BATTLE,
          currentTurn: this.playerOrder[this.currentTurnIndex],
          bonusRollsLeft: this.getBonusRollsMap(),
        });
      }
    }, TURN_DELAY_MS);

    return { success: true };
  }

  getBonusRollsMap() {
    const map = {};
    for (const pid of this.playerOrder) {
      map[pid] = this.players[pid]?.bonusRollsLeft ?? 0;
    }
    return map;
  }

  getMatchAnalytics(reason, winnerId) {
    return {
      roomCode: this.roomCode,
      reason,
      winnerId,
      turnsCompleted: this.turnsCompleted,
      kingShotsFired: this.kingShotsFired,
      bonusRollsUsed: this.bonusRollsUsed,
      durationMs: this.matchStartedAt ? Date.now() - this.matchStartedAt : null,
      drawingTimeSeconds: this.drawingTimeSeconds,
    };
  }

  logMatchEnd(reason, winnerId) {
    try {
      const analytics = this.getMatchAnalytics(reason, winnerId);
      // Single-line JSON with a stable prefix so it's grep-able from logs
      console.log(`MATCH_END ${JSON.stringify(analytics)}`);
    } catch (e) {
      console.error('Failed to log match end:', e.message);
    }
  }

  allPlayersReady(field) {
    return this.playerOrder.length === 2 &&
      this.playerOrder.every((pid) => this.players[pid]?.[field]);
  }

  getStats() {
    const stats = {};
    for (const pid of this.playerOrder) {
      const p = this.players[pid];
      if (p) {
        stats[pid] = {
          name: p.name,
          tanksRemaining: p.tanks.filter((t) => !t.destroyed).length,
          totalHP: p.tanks.reduce((sum, t) => sum + t.hp, 0),
        };
      }
    }
    return stats;
  }

  getState(forPlayerId) {
    const oppId = this.playerOrder.find((id) => id !== forPlayerId);
    return {
      phase: this.phase,
      roomCode: this.roomCode,
      players: Object.fromEntries(
        this.playerOrder.map((pid) => [
          pid,
          { id: pid, name: this.players[pid]?.name || 'Unknown', connected: this.players[pid]?.connected || false },
        ])
      ),
      myTanks: this.players[forPlayerId]?.tanks || [],
      opponentTanks: oppId ? this.players[oppId]?.tanks?.map((t) => ({
        id: t.id, imageUrl: t.imageUrl, bulletUrl: t.bulletUrl,
        hp: t.hp, isKing: t.isKing, destroyed: t.destroyed,
      })) || [] : [],
      currentTurn: this.playerOrder[this.currentTurnIndex] || null,
      bonusRollsLeft: this.getBonusRollsMap(),
    };
  }

  sendTo(playerId, type, payload) {
    try {
      const player = this.players[playerId];
      if (player?.ws?.readyState === 1) {
        player.ws.send(JSON.stringify({ type, payload }));
      }
    } catch (e) {
      console.error(`Send failed for ${playerId}:`, e.message);
    }
  }

  sendToSpectator(ws, type, payload) {
    try {
      if (ws?.readyState === 1) {
        ws.send(JSON.stringify({ type, payload }));
      }
    } catch (e) {
      console.error('Send to spectator failed:', e.message);
    }
  }

  broadcastToSpectators(type, payload) {
    for (const ws of this.spectators) {
      this.sendToSpectator(ws, type, payload);
    }
  }

  broadcast(type, payload) {
    for (const pid of this.playerOrder) this.sendTo(pid, type, payload);
    this.broadcastToSpectators(type, payload);
  }

  broadcastToOthers(excludeId, type, payload) {
    for (const pid of this.playerOrder) {
      if (pid !== excludeId) this.sendTo(pid, type, payload);
    }
    // Spectators always see everything
    this.broadcastToSpectators(type, payload);
  }

  addSpectator(ws) {
    if (this.phase === PHASES.GAME_OVER) {
      return { error: 'Match is over' };
    }
    this.spectators.add(ws);
    this.touch();

    // Send the spectator a current snapshot from player 1's perspective.
    // Spectators see "myTanks" = p1's tanks, "opponentTanks" = p2's.
    const p1 = this.playerOrder[0];
    if (p1) {
      const state = this.getState(p1);
      // Make sure spectator-visible opponent tanks include image data (they're the
      // observer, both sides should be fully visible).
      this.sendToSpectator(ws, 'SYNC_STATE', { ...state, isSpectator: true });
    } else {
      this.sendToSpectator(ws, 'SYNC_STATE', {
        phase: this.phase,
        roomCode: this.roomCode,
        players: {},
        myTanks: [],
        opponentTanks: [],
        currentTurn: null,
        bonusRollsLeft: {},
        isSpectator: true,
      });
    }

    // Notify both players a spectator joined (for a small toast)
    for (const pid of this.playerOrder) {
      this.sendTo(pid, 'SPECTATOR_JOINED', { count: this.spectators.size });
    }

    return { success: true };
  }

  removeSpectator(ws) {
    if (this.spectators.has(ws)) {
      this.spectators.delete(ws);
      // Quietly notify players the count dropped
      for (const pid of this.playerOrder) {
        this.sendTo(pid, 'SPECTATOR_JOINED', { count: this.spectators.size });
      }
    }
  }

  isEmpty() {
    return this.playerOrder.every((pid) => !this.players[pid]?.connected);
  }

  isStale(maxAge = 600000) {
    return Date.now() - this.lastActivity > maxAge;
  }

  cleanup() {
    Object.values(this.disconnectTimers).forEach(clearTimeout);
    this.disconnectTimers = {};
    if (this.turnTimer) clearTimeout(this.turnTimer);
    this.spectators.clear();
  }
}

module.exports = GameRoom;
