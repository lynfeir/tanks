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
