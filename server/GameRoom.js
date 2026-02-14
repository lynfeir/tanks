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
const DISCONNECT_GRACE_MS = 60000;

class GameRoom {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.phase = PHASES.LOBBY;
    this.players = {};
    this.playerOrder = [];
    this.currentTurnIndex = 0;
    this.disconnectTimers = {};
    this.createdAt = Date.now();
  }

  addPlayer(playerId, playerName, ws) {
    if (this.playerOrder.length >= 2) {
      return { error: 'Room is full' };
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
    };

    this.playerOrder.push(playerId);

    if (this.playerOrder.length === 2) {
      this.phase = PHASES.DRAWING;
      this.broadcast('PHASE_CHANGE', { phase: PHASES.DRAWING });
    }

    return { success: true };
  }

  reconnectPlayer(playerId, ws) {
    const player = this.players[playerId];
    if (!player) return false;

    if (this.disconnectTimers[playerId]) {
      clearTimeout(this.disconnectTimers[playerId]);
      delete this.disconnectTimers[playerId];
    }

    player.ws = ws;
    player.connected = true;

    this.broadcastToOthers(playerId, 'PLAYER_RECONNECTED', { playerId });

    this.sendTo(playerId, 'SYNC_STATE', this.getState(playerId));

    return true;
  }

  handleDisconnect(playerId) {
    const player = this.players[playerId];
    if (!player) return;

    player.connected = false;
    player.ws = null;

    this.broadcastToOthers(playerId, 'PLAYER_DISCONNECTED', { playerId });

    this.disconnectTimers[playerId] = setTimeout(() => {
      if (!this.players[playerId]?.connected) {
        const winnerId = this.playerOrder.find((id) => id !== playerId);
        if (winnerId) {
          this.phase = PHASES.GAME_OVER;
          this.broadcast('GAME_OVER', {
            winnerId,
            reason: 'disconnect',
            stats: this.getStats(),
          });
        }
      }
    }, DISCONNECT_GRACE_MS);
  }

  submitDrawings(playerId, tanks, bullets) {
    if (this.phase !== PHASES.DRAWING) {
      return { error: 'Not in drawing phase' };
    }

    const player = this.players[playerId];
    if (!player) return { error: 'Player not found' };

    for (let i = 0; i < TANKS_PER_PLAYER; i++) {
      player.tanks[i].imageUrl = tanks[i] || null;
      player.tanks[i].bulletUrl = bullets[i] || null;
    }
    player.drawingsSubmitted = true;

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
    if (tankIndex < 0 || tankIndex >= TANKS_PER_PLAYER) {
      return { error: 'Invalid tank index' };
    }

    player.tanks.forEach((t, i) => {
      t.isKing = i === tankIndex;
      t.hp = i === tankIndex ? KING_HP : NORMAL_HP;
    });
    player.kingSelected = true;

    this.broadcastToOthers(playerId, 'KING_SELECTED', { playerId });

    if (this.allPlayersReady('kingSelected')) {
      this.startBattle();
    }

    return { success: true };
  }

  startBattle() {
    this.phase = PHASES.BATTLE;
    this.currentTurnIndex = 0;

    const opponentTanksMap = {};
    for (const pid of this.playerOrder) {
      const oppId = this.playerOrder.find((id) => id !== pid);
      opponentTanksMap[pid] = this.players[oppId].tanks.map((t) => ({
        id: t.id,
        imageUrl: t.imageUrl,
        bulletUrl: t.bulletUrl,
        hp: t.hp,
        isKing: t.isKing,
        destroyed: t.destroyed,
      }));
    }

    for (const pid of this.playerOrder) {
      this.sendTo(pid, 'PHASE_CHANGE', {
        phase: PHASES.BATTLE,
        currentTurn: this.playerOrder[this.currentTurnIndex],
        opponentTanks: opponentTanksMap[pid],
      });
    }
  }

  rollDice(playerId) {
    if (this.phase !== PHASES.BATTLE) {
      return { error: 'Not in battle phase' };
    }

    const currentTurnPlayer = this.playerOrder[this.currentTurnIndex];
    if (playerId !== currentTurnPlayer) {
      return { error: 'Not your turn' };
    }

    const attackerId = playerId;
    const defenderId = this.playerOrder.find((id) => id !== playerId);
    const attacker = this.players[attackerId];
    const defender = this.players[defenderId];

    const aliveTanks = attacker.tanks.filter((t) => !t.destroyed);
    const aliveTargets = defender.tanks.filter((t) => !t.destroyed);

    if (aliveTanks.length === 0 || aliveTargets.length === 0) {
      return { error: 'No valid tanks' };
    }

    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;

    const shooterIndex = aliveTanks[roll1 % aliveTanks.length].id;
    const targetIndex = aliveTargets[roll2 % aliveTargets.length].id;

    const shooterTank = attacker.tanks[shooterIndex];
    const targetTank = defender.tanks[targetIndex];

    const isKingShot = shooterTank.isKing;
    const damage = isKingShot ? 999 : 1;

    if (isKingShot) {
      targetTank.hp = 0;
      targetTank.destroyed = true;
    } else {
      targetTank.hp = Math.max(0, targetTank.hp - damage);
      targetTank.destroyed = targetTank.hp <= 0;
    }

    this.broadcast('DICE_RESULT', {
      roll1,
      roll2,
      attackerId,
      defenderId,
      shooterTank: shooterIndex,
      targetTank: targetIndex,
      isKingShot,
      damage,
    });

    this.broadcast('TANK_HIT', {
      targetPlayerId: defenderId,
      tankIndex: targetIndex,
      damage,
      isKingShot,
      remainingHP: targetTank.hp,
      destroyed: targetTank.destroyed,
    });

    const defenderAlive = defender.tanks.some((t) => !t.destroyed);
    if (!defenderAlive) {
      this.phase = PHASES.GAME_OVER;
      this.broadcast('GAME_OVER', {
        winnerId: attackerId,
        reason: 'all_destroyed',
        stats: this.getStats(),
      });
      return { success: true };
    }

    this.currentTurnIndex = (this.currentTurnIndex + 1) % 2;
    setTimeout(() => {
      if (this.phase === PHASES.BATTLE) {
        this.broadcast('PHASE_CHANGE', {
          phase: PHASES.BATTLE,
          currentTurn: this.playerOrder[this.currentTurnIndex],
        });
      }
    }, 3000);

    return { success: true };
  }

  allPlayersReady(field) {
    return this.playerOrder.every((pid) => this.players[pid]?.[field]);
  }

  getStats() {
    const stats = {};
    for (const pid of this.playerOrder) {
      const p = this.players[pid];
      stats[pid] = {
        name: p.name,
        tanksRemaining: p.tanks.filter((t) => !t.destroyed).length,
        totalHP: p.tanks.reduce((sum, t) => sum + t.hp, 0),
      };
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
          { id: pid, name: this.players[pid].name, connected: this.players[pid].connected },
        ])
      ),
      myTanks: this.players[forPlayerId]?.tanks || [],
      opponentTanks: oppId ? this.players[oppId].tanks : [],
      currentTurn: this.playerOrder[this.currentTurnIndex],
    };
  }

  sendTo(playerId, type, payload) {
    const player = this.players[playerId];
    if (player?.ws?.readyState === 1) {
      player.ws.send(JSON.stringify({ type, payload }));
    }
  }

  broadcast(type, payload) {
    for (const pid of this.playerOrder) {
      this.sendTo(pid, type, payload);
    }
  }

  broadcastToOthers(excludeId, type, payload) {
    for (const pid of this.playerOrder) {
      if (pid !== excludeId) {
        this.sendTo(pid, type, payload);
      }
    }
  }

  isEmpty() {
    return this.playerOrder.every((pid) => !this.players[pid]?.connected);
  }

  cleanup() {
    Object.values(this.disconnectTimers).forEach(clearTimeout);
    this.disconnectTimers = {};
  }
}

module.exports = GameRoom;
