const http = require('http');
const { WebSocketServer } = require('ws');
const GameRoom = require('./GameRoom');
const { generateRoomCode, generatePlayerId } = require('./utils');

const isRailway = Boolean(
  process.env.RAILWAY_PROJECT_ID ||
  process.env.RAILWAY_ENVIRONMENT_ID ||
  process.env.RAILWAY_ENVIRONMENT
);
const PORT = Number(process.env.PORT || (isRailway ? 8080 : 3001));
const rooms = new Map();
const playerRoomMap = new Map();

const httpServer = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

const wss = new WebSocketServer({ server: httpServer });

httpServer.listen(PORT, () => {
  console.log(`Rollin' Tanks WS server running on port ${PORT}`);
});

// Cleanup stale rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if ((room.isEmpty() && now - room.createdAt > 300000) || room.isStale(600000)) {
      room.cleanup();
      rooms.delete(code);
      console.log(`Cleaned up room ${code}`);
    }
  }
}, 300000);

wss.on('connection', (ws) => {
  let currentPlayerId = null;
  let currentRoomCode = null;

  ws.isAlive = true;
  ws.missedPongs = 0;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (e) {
      sendError(ws, 'Invalid message format');
      return;
    }

    const { type, payload } = msg;

    switch (type) {
      case 'CREATE_ROOM': {
        const playerName = payload?.playerName?.trim();
        if (!playerName) {
          sendError(ws, 'Player name is required');
          return;
        }

        let roomCode;
        let attempts = 0;
        do {
          roomCode = generateRoomCode();
          attempts++;
        } while (rooms.has(roomCode) && attempts < 100);

        if (rooms.has(roomCode)) {
          sendError(ws, 'Could not create room, please try again');
          return;
        }

        const playerId = generatePlayerId();
        const room = new GameRoom(roomCode);
        rooms.set(roomCode, room);

        const result = room.addPlayer(playerId, playerName, ws);
        if (result.error) {
          sendError(ws, result.error);
          return;
        }

        currentPlayerId = playerId;
        currentRoomCode = roomCode;
        playerRoomMap.set(playerId, roomCode);

        send(ws, 'ROOM_CREATED', { roomCode, playerId });
        console.log(`Room ${roomCode} created by ${playerName} (${playerId})`);
        break;
      }

      case 'JOIN_ROOM': {
        const playerName = payload?.playerName?.trim();
        const roomCode = payload?.roomCode?.toUpperCase();

        if (!playerName) {
          sendError(ws, 'Player name is required');
          return;
        }
        if (!roomCode) {
          sendError(ws, 'Room code is required');
          return;
        }

        const room = rooms.get(roomCode);
        if (!room) {
          sendError(ws, 'Room not found. Check the code and try again.');
          return;
        }

        const playerId = generatePlayerId();
        const result = room.addPlayer(playerId, playerName, ws);
        if (result.error) {
          sendError(ws, result.error);
          return;
        }

        currentPlayerId = playerId;
        currentRoomCode = roomCode;
        playerRoomMap.set(playerId, roomCode);

        send(ws, 'PLAYER_JOINED', {
          roomCode,
          playerId,
          players: Object.fromEntries(
            room.playerOrder.map((pid) => [
              pid,
              { id: pid, name: room.players[pid].name },
            ])
          ),
          phase: room.phase,
        });

        room.broadcastToOthers(playerId, 'PLAYER_JOINED', {
          roomCode,
          players: Object.fromEntries(
            room.playerOrder.map((pid) => [
              pid,
              { id: pid, name: room.players[pid].name },
            ])
          ),
          phase: room.phase,
        });

        console.log(`${playerName} (${playerId}) joined room ${roomCode}`);
        break;
      }

      case 'RECONNECT': {
        const { roomCode, playerId } = payload || {};
        const room = rooms.get(roomCode);
        if (room && room.reconnectPlayer(playerId, ws)) {
          currentPlayerId = playerId;
          currentRoomCode = roomCode;
          console.log(`Player ${playerId} reconnected to room ${roomCode}`);
        } else {
          sendError(ws, 'Could not reconnect. Room may have expired.');
        }
        break;
      }

      case 'SUBMIT_DRAWINGS': {
        const room = getRoom();
        if (!room) return;

        const result = room.submitDrawings(
          currentPlayerId,
          payload.tanks,
          payload.bullets
        );
        if (result.error) {
          sendError(ws, result.error);
        }
        break;
      }

      case 'SELECT_KING': {
        const room = getRoom();
        if (!room) return;

        const result = room.selectKing(currentPlayerId, payload.tankIndex);
        if (result.error) {
          sendError(ws, result.error);
        }
        break;
      }

      case 'ROLL_DICE': {
        const room = getRoom();
        if (!room) return;

        const result = room.rollDice(currentPlayerId);
        if (result.error) {
          sendError(ws, result.error);
        }
        break;
      }

      case 'PING':
        send(ws, 'PONG', {});
        break;

      default:
        console.log('Unknown message type:', type);
    }

    function getRoom() {
      if (!currentRoomCode) {
        sendError(ws, 'Not in a room');
        return null;
      }
      const room = rooms.get(currentRoomCode);
      if (!room) {
        sendError(ws, 'Room no longer exists');
        return null;
      }
      return room;
    }
  });

  ws.on('close', () => {
    if (currentPlayerId && currentRoomCode) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.handleDisconnect(currentPlayerId, ws);
        console.log(`Player ${currentPlayerId} disconnected from room ${currentRoomCode}`);
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

// Heartbeat to detect stale connections
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.missedPongs >= 2) {
      ws.terminate();
      return;
    }
    if (!ws.isAlive) {
      ws.missedPongs = (ws.missedPongs || 0) + 1;
    } else {
      ws.missedPongs = 0;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeat);
});

function send(ws, type, payload) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

function sendError(ws, message) {
  send(ws, 'ERROR', { message });
}
