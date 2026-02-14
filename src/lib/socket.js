import { WS_URL } from './constants';

let ws = null;
let messageHandlers = new Set();
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;
let pingInterval = null;
let pendingRoomCode = null;
let pendingPlayerId = null;

function getReconnectDelay() {
  return Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
}

export function addMessageHandler(handler) {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}

export function removeMessageHandler(handler) {
  messageHandlers.delete(handler);
}

function notifyHandlers(message) {
  messageHandlers.forEach((handler) => {
    try {
      handler(message);
    } catch (e) {
      console.error('Message handler error:', e);
    }
  });
}

function startPing() {
  stopPing();
  pingInterval = setInterval(() => {
    sendMessage('PING', {});
  }, 25000);
}

function stopPing() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

export function connect(onOpen, onClose, onError) {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }

  try {
    ws = new WebSocket(WS_URL);
  } catch (e) {
    console.error('WebSocket creation failed:', e);
    if (onError) onError(e);
    return;
  }

  ws.onopen = () => {
    console.log('WebSocket connected');
    reconnectAttempts = 0;
    startPing();
    if (onOpen) onOpen();

    if (pendingRoomCode && pendingPlayerId) {
      sendMessage('RECONNECT', {
        roomCode: pendingRoomCode,
        playerId: pendingPlayerId,
      });
    }
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      notifyHandlers(message);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  };

  ws.onclose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
    stopPing();
    ws = null;
    if (onClose) onClose(event);

    if (!event.wasClean) {
      const delay = getReconnectDelay();
      reconnectAttempts++;
      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
      reconnectTimer = setTimeout(() => {
        connect(onOpen, onClose, onError);
      }, delay);
    }
  };

  ws.onerror = (event) => {
    console.error('WebSocket error:', event);
    if (onError) onError(event);
  };
}

export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  stopPing();
  pendingRoomCode = null;
  pendingPlayerId = null;
  reconnectAttempts = 0;
  if (ws) {
    ws.close(1000, 'Client disconnect');
    ws = null;
  }
}

export function sendMessage(type, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
    return true;
  }
  console.warn('WebSocket not connected, cannot send:', type);
  return false;
}

export function setReconnectInfo(roomCode, playerId) {
  pendingRoomCode = roomCode;
  pendingPlayerId = playerId;
}

export function isConnected() {
  return ws && ws.readyState === WebSocket.OPEN;
}
