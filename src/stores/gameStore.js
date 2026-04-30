import { create } from 'zustand';
import { GAME_PHASES, TANKS_PER_PLAYER, NORMAL_TANK_HP, KING_TANK_HP, DEFAULT_DRAWING_TIME } from '@/lib/constants';

function createEmptyTanks() {
  return Array.from({ length: TANKS_PER_PLAYER }, (_, i) => ({
    id: i,
    imageUrl: null,
    bulletUrl: null,
    hp: NORMAL_TANK_HP,
    isKing: false,
    destroyed: false,
  }));
}

const useGameStore = create((set, get) => ({
  // Connection
  roomCode: null,
  playerId: null,
  playerName: '',
  connected: false,
  reconnecting: false,

  // Game phase
  phase: GAME_PHASES.LOBBY,

  // Players
  players: {},
  myTanks: createEmptyTanks(),
  opponentTanks: createEmptyTanks(),

  // Drawing
  currentDrawingIndex: 0,
  drawingType: 'tank', // 'tank' or 'bullet'
  drawingTimeSeconds: DEFAULT_DRAWING_TIME,

  // Battle
  currentTurn: null,
  isMyTurn: false,
  diceResults: null,
  lastHit: null,
  animationPlaying: false,
  gameOverData: null,
  killFeed: [],
  bonusRollsLeft: {}, // map of playerId -> bonus rolls remaining

  // UI
  toasts: [],
  error: null,

  // Actions
  setConnection: (roomCode, playerId) =>
    set({ roomCode, playerId, connected: true, reconnecting: false }),

  setPlayerName: (name) => set({ playerName: name }),

  setPhase: (phase) => set({ phase }),

  setConnected: (connected) => set({ connected }),

  setReconnecting: (reconnecting) => set({ reconnecting }),

  setPlayers: (players) => set({ players }),

  updateMyTank: (index, data) =>
    set((state) => {
      const tanks = [...state.myTanks];
      tanks[index] = { ...tanks[index], ...data };
      return { myTanks: tanks };
    }),

  setMyTankDrawing: (index, imageUrl) =>
    set((state) => {
      const tanks = [...state.myTanks];
      tanks[index] = { ...tanks[index], imageUrl };
      return { myTanks: tanks };
    }),

  setMyBulletDrawing: (index, bulletUrl) =>
    set((state) => {
      const tanks = [...state.myTanks];
      tanks[index] = { ...tanks[index], bulletUrl };
      return { myTanks: tanks };
    }),

  setOpponentTanks: (tanks) => set({ opponentTanks: tanks }),

  nextDrawing: () =>
    set((state) => {
      if (state.drawingType === 'tank') {
        if (state.currentDrawingIndex < TANKS_PER_PLAYER - 1) {
          return { currentDrawingIndex: state.currentDrawingIndex + 1 };
        }
        return { currentDrawingIndex: 0, drawingType: 'bullet' };
      }
      if (state.currentDrawingIndex < TANKS_PER_PLAYER - 1) {
        return { currentDrawingIndex: state.currentDrawingIndex + 1 };
      }
      return {};
    }),

  prevDrawing: () =>
    set((state) => {
      if (state.drawingType === 'bullet') {
        if (state.currentDrawingIndex > 0) {
          return { currentDrawingIndex: state.currentDrawingIndex - 1 };
        }
        return { currentDrawingIndex: TANKS_PER_PLAYER - 1, drawingType: 'tank' };
      }
      if (state.currentDrawingIndex > 0) {
        return { currentDrawingIndex: state.currentDrawingIndex - 1 };
      }
      return {};
    }),

  selectKing: (index) =>
    set((state) => {
      const tanks = state.myTanks.map((t, i) => ({
        ...t,
        isKing: i === index,
        hp: i === index ? KING_TANK_HP : NORMAL_TANK_HP,
      }));
      return { myTanks: tanks };
    }),

  setCurrentTurn: (playerId) =>
    set((state) => ({
      currentTurn: playerId,
      isMyTurn: playerId === state.playerId,
    })),

  setDiceResults: (results) => set({ diceResults: results }),

  applyHit: (targetPlayerId, tankIndex, isKingShot, remainingHP, destroyed) =>
    set((state) => {
      const isMyTank = targetPlayerId === state.playerId;
      const key = isMyTank ? 'myTanks' : 'opponentTanks';
      const tanks = [...state[key]];
      if (!tanks[tankIndex] || tanks[tankIndex].destroyed) return {};
      const tank = { ...tanks[tankIndex] };

      tank.hp = remainingHP;
      tank.destroyed = destroyed;

      tanks[tankIndex] = tank;
      return { [key]: tanks, lastHit: { targetPlayerId, tankIndex, isKingShot } };
    }),

  setAnimationPlaying: (playing) => set({ animationPlaying: playing }),

  setGameOverData: (data) => set({ gameOverData: data }),

  addKillFeedEntry: (entry) =>
    set((state) => ({
      killFeed: [
        ...state.killFeed.slice(-19),
        { id: `kf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: Date.now(), ...entry },
      ],
    })),

  setBonusRollsLeft: (map) => set({ bonusRollsLeft: map || {} }),

  setDrawingTimeSeconds: (seconds) =>
    set({ drawingTimeSeconds: Number(seconds) > 0 ? Number(seconds) : DEFAULT_DRAWING_TIME }),

  addToast: (message, type = 'info') =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now(), message, type }],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setError: (error) => set({ error }),

  resetGame: () =>
    set({
      phase: GAME_PHASES.LOBBY,
      players: {},
      myTanks: createEmptyTanks(),
      opponentTanks: createEmptyTanks(),
      currentDrawingIndex: 0,
      drawingType: 'tank',
      currentTurn: null,
      isMyTurn: false,
      diceResults: null,
      lastHit: null,
      animationPlaying: false,
      gameOverData: null,
      killFeed: [],
      bonusRollsLeft: {},
      error: null,
    }),

  syncState: (serverState) =>
    set((state) => {
      const serverPlayers = serverState.players || {};

      return {
        phase: serverState.phase,
        players: serverPlayers,
        currentTurn: serverState.currentTurn,
        isMyTurn: serverState.currentTurn === state.playerId,
        myTanks: serverState.myTanks || state.myTanks,
        opponentTanks: serverState.opponentTanks || state.opponentTanks,
        bonusRollsLeft: serverState.bonusRollsLeft || state.bonusRollsLeft,
      };
    }),
}));

export default useGameStore;
