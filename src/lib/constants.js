export const GAME_PHASES = {
  LOBBY: 'lobby',
  DRAWING: 'drawing',
  KING_SELECTION: 'king_selection',
  BATTLE: 'battle',
  GAME_OVER: 'game_over',
};

export const TANKS_PER_PLAYER = 6;
export const NORMAL_TANK_HP = 2;
export const KING_TANK_HP = 1;
export const DRAWING_TIME_SECONDS = 180;
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 300;
export const DISCONNECT_GRACE_MS = 90000;
export const ROOM_CODE_LENGTH = 6;

export const BRUSH_SIZES = [3, 6, 12, 20];

export const COLOR_PALETTE = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#e94560', '#ff6b6b', '#ffa502', '#ffda79',
  '#2ed573', '#7bed9f', '#1e90ff', '#70a1ff',
  '#ffffff', '#d2dae2', '#808e9b', '#485460',
];

export const WS_MESSAGES = {
  CREATE_ROOM: 'CREATE_ROOM',
  JOIN_ROOM: 'JOIN_ROOM',
  ROOM_CREATED: 'ROOM_CREATED',
  PLAYER_JOINED: 'PLAYER_JOINED',
  PHASE_CHANGE: 'PHASE_CHANGE',
  SUBMIT_DRAWINGS: 'SUBMIT_DRAWINGS',
  DRAWINGS_RECEIVED: 'DRAWINGS_RECEIVED',
  SELECT_KING: 'SELECT_KING',
  KING_SELECTED: 'KING_SELECTED',
  ROLL_DICE: 'ROLL_DICE',
  DICE_RESULT: 'DICE_RESULT',
  TANK_HIT: 'TANK_HIT',
  GAME_OVER: 'GAME_OVER',
  ERROR: 'ERROR',
  PING: 'PING',
  PONG: 'PONG',
  PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED: 'PLAYER_RECONNECTED',
  SYNC_STATE: 'SYNC_STATE',
};

const DEFAULT_WS_URL = 'wss://tanks-production-d9e4.up.railway.app';

function normalizeWebSocketUrl(rawUrl) {
  const value = (rawUrl || '').trim();
  if (!value) return DEFAULT_WS_URL;

  if (/^wss?:\/\//i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value.replace(/^http/i, 'ws');

  const hasWindow = typeof window !== 'undefined';
  if (value.startsWith('/')) {
    if (hasWindow) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}${value}`;
    }
    return DEFAULT_WS_URL;
  }

  if (hasWindow) {
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    return `${protocol}${value.replace(/^\/+/, '')}`;
  }

  return `wss://${value.replace(/^\/+/, '')}`;
}

export const WS_URL = normalizeWebSocketUrl(
  process.env.NEXT_PUBLIC_WS_URL || DEFAULT_WS_URL
);
