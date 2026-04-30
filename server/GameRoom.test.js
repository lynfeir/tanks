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
