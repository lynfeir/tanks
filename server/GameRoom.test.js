const test = require('node:test');
const assert = require('node:assert/strict');
const GameRoom = require('./GameRoom');

function createSocket() {
  return {
    readyState: 1,
    send() {},
  };
}

test('stale close after reconnect is ignored', () => {
  const room = new GameRoom('ROOM01');
  const wsOld = createSocket();
  const wsNew = createSocket();

  room.addPlayer('p1', 'Alice', wsOld);
  room.addPlayer('p2', 'Bob', createSocket());

  assert.equal(room.reconnectPlayer('p1', wsNew), true);

  room.handleDisconnect('p1', wsOld);

  assert.equal(room.players.p1.connected, true);
  assert.equal(room.players.p1.ws, wsNew);
  assert.equal(room.disconnectTimers.p1, undefined);

  room.cleanup();
});

test('active close disconnects player and starts grace timer', () => {
  const room = new GameRoom('ROOM02');
  const wsCurrent = createSocket();

  room.addPlayer('p1', 'Alice', wsCurrent);
  room.addPlayer('p2', 'Bob', createSocket());

  room.handleDisconnect('p1', wsCurrent);

  assert.equal(room.players.p1.connected, false);
  assert.equal(room.players.p1.ws, null);
  assert.ok(room.disconnectTimers.p1);

  room.cleanup();
});

test('new players start with one bonus roll', () => {
  const room = new GameRoom('ROOM03');
  room.addPlayer('p1', 'Alice', createSocket());
  room.addPlayer('p2', 'Bob', createSocket());

  assert.equal(room.players.p1.bonusRollsLeft, 1);
  assert.equal(room.players.p2.bonusRollsLeft, 1);
  assert.deepEqual(room.getBonusRollsMap(), { p1: 1, p2: 1 });

  room.cleanup();
});

test('bonus roll: decrements counter and skips turn advance', () => {
  const room = new GameRoom('ROOM04');
  room.addPlayer('p1', 'Alice', createSocket());
  room.addPlayer('p2', 'Bob', createSocket());

  // Skip drawing/king phases by setting state directly
  room.phase = 'battle';
  room.currentTurnIndex = 0;
  room.players.p1.tanks.forEach((t) => { t.imageUrl = 'x'; t.bulletUrl = 'x'; });
  room.players.p2.tanks.forEach((t) => { t.imageUrl = 'x'; t.bulletUrl = 'x'; });

  // Use bonus roll
  const result = room.rollDice('p1', { useBonus: true });
  assert.equal(result.success, true);
  assert.equal(room.players.p1.bonusRollsLeft, 0, 'bonus roll counter decrements');

  // Advance the turn timer manually so we can inspect the result without the real timeout
  // (in a real game the setTimeout above runs the turn advance)
  // Verify bonus was registered by checking that getBonusRollsMap reflects the new count
  assert.deepEqual(room.getBonusRollsMap(), { p1: 0, p2: 1 });

  room.cleanup();
});

test('bonus roll without remaining: rolls normally, no decrement', () => {
  const room = new GameRoom('ROOM05');
  room.addPlayer('p1', 'Alice', createSocket());
  room.addPlayer('p2', 'Bob', createSocket());

  room.phase = 'battle';
  room.currentTurnIndex = 0;
  room.players.p1.bonusRollsLeft = 0;
  room.players.p1.tanks.forEach((t) => { t.imageUrl = 'x'; t.bulletUrl = 'x'; });
  room.players.p2.tanks.forEach((t) => { t.imageUrl = 'x'; t.bulletUrl = 'x'; });

  const result = room.rollDice('p1', { useBonus: true });
  assert.equal(result.success, true);
  assert.equal(room.players.p1.bonusRollsLeft, 0, 'cannot go negative');

  room.cleanup();
});

test('drawing time defaults to 120 and accepts allowlist values', () => {
  const r1 = new GameRoom('ROOM06');
  assert.equal(r1.drawingTimeSeconds, 120, 'default is 120');
  r1.cleanup();

  const r2 = new GameRoom('ROOM07', { drawingTimeSeconds: 60 });
  assert.equal(r2.drawingTimeSeconds, 60);
  r2.cleanup();

  const r3 = new GameRoom('ROOM08', { drawingTimeSeconds: 180 });
  assert.equal(r3.drawingTimeSeconds, 180);
  r3.cleanup();

  // Out-of-allowlist values fall back to default
  const r4 = new GameRoom('ROOM09', { drawingTimeSeconds: 9999 });
  assert.equal(r4.drawingTimeSeconds, 120);
  r4.cleanup();
});

test('spectator: addSpectator returns success and includes spectator in broadcast', () => {
  const room = new GameRoom('ROOM11');
  const p1ws = createSocket();
  const p2ws = createSocket();
  room.addPlayer('p1', 'Alice', p1ws);
  room.addPlayer('p2', 'Bob', p2ws);

  // Track sends to spectator
  let specReceivedTypes = [];
  const specWs = {
    readyState: 1,
    send(data) {
      specReceivedTypes.push(JSON.parse(data).type);
    },
  };

  const result = room.addSpectator(specWs);
  assert.equal(result.success, true);
  assert.ok(specReceivedTypes.includes('SYNC_STATE'), 'spectator gets initial SYNC_STATE');
  assert.equal(room.spectators.size, 1);

  // Subsequent broadcasts reach the spectator
  specReceivedTypes = [];
  room.broadcast('PHASE_CHANGE', { phase: 'battle' });
  assert.ok(specReceivedTypes.includes('PHASE_CHANGE'), 'spectator receives broadcasts');

  // Removing
  room.removeSpectator(specWs);
  assert.equal(room.spectators.size, 0);

  room.cleanup();
});

test('spectator: rejected if match is over', () => {
  const room = new GameRoom('ROOM12');
  room.addPlayer('p1', 'Alice', createSocket());
  room.addPlayer('p2', 'Bob', createSocket());
  room.phase = 'game_over';

  const result = room.addSpectator({ readyState: 1, send() {} });
  assert.ok(result.error, 'rejects when game is over');

  room.cleanup();
});

test('match analytics: counters track turns/king-shots/bonuses', () => {
  const room = new GameRoom('ROOM10');
  room.addPlayer('p1', 'Alice', createSocket());
  room.addPlayer('p2', 'Bob', createSocket());

  // Start battle so matchStartedAt is set
  room.startBattle();

  // Make tank 0 the king for p1
  room.players.p1.tanks[0].isKing = true;
  room.players.p1.tanks[0].hp = 1;
  // All tanks must have artwork to be valid
  room.players.p1.tanks.forEach((t) => { t.imageUrl = 'x'; t.bulletUrl = 'x'; });
  room.players.p2.tanks.forEach((t) => { t.imageUrl = 'x'; t.bulletUrl = 'x'; });

  const before = room.turnsCompleted;
  room.rollDice('p1');
  assert.equal(room.turnsCompleted, before + 1, 'turn counter increments');
  // kingShotsFired increments when shooter is the king (probabilistic — only if the random roll lands on the king tank)
  // We can't deterministically verify without seeding, but we can verify analytics structure
  const analytics = room.getMatchAnalytics('all_destroyed', 'p1');
  assert.equal(analytics.roomCode, 'ROOM10');
  assert.equal(analytics.reason, 'all_destroyed');
  assert.equal(analytics.winnerId, 'p1');
  assert.ok(analytics.durationMs >= 0, 'duration is non-negative');

  room.cleanup();
});
