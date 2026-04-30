'use client';
import { useEffect, useCallback, useRef } from 'react';
import useGameStore from '@/stores/gameStore';
import { connect, disconnect, sendMessage, addMessageHandler, setReconnectInfo } from '@/lib/socket';
import { WS_MESSAGES, GAME_PHASES } from '@/lib/constants';

export default function useWebSocket() {
  const store = useGameStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    const handleMessage = (msg) => {
      const s = storeRef.current;
      switch (msg.type) {
        case WS_MESSAGES.ROOM_CREATED:
          s.setConnection(msg.payload.roomCode, msg.payload.playerId);
          setReconnectInfo(msg.payload.roomCode, msg.payload.playerId);
          break;

        case WS_MESSAGES.PLAYER_JOINED:
          s.setPlayers(msg.payload.players);
          if (msg.payload.playerId && !s.playerId) {
            s.setConnection(msg.payload.roomCode, msg.payload.playerId);
            setReconnectInfo(msg.payload.roomCode, msg.payload.playerId);
          }
          if (msg.payload.phase) {
            s.setPhase(msg.payload.phase);
          }
          break;

        case WS_MESSAGES.PHASE_CHANGE:
          s.setPhase(msg.payload.phase);
          if (msg.payload.currentTurn) {
            s.setCurrentTurn(msg.payload.currentTurn);
          }
          if (msg.payload.opponentTanks) {
            s.setOpponentTanks(msg.payload.opponentTanks);
          }
          if (msg.payload.bonusRollsLeft) {
            s.setBonusRollsLeft(msg.payload.bonusRollsLeft);
          }
          if (msg.payload.drawingTimeSeconds) {
            s.setDrawingTimeSeconds(msg.payload.drawingTimeSeconds);
          }
          break;

        case WS_MESSAGES.DRAWINGS_RECEIVED:
          s.addToast('Opponent finished drawing!', 'info');
          break;

        case WS_MESSAGES.KING_SELECTED:
          s.addToast('Opponent selected their King!', 'info');
          break;

        case WS_MESSAGES.DICE_RESULT:
          s.setDiceResults(msg.payload);
          if (msg.payload.bonusRollsLeft) {
            s.setBonusRollsLeft(msg.payload.bonusRollsLeft);
          }
          break;

        case WS_MESSAGES.TANK_HIT: {
          const { targetPlayerId, tankIndex, isKingShot, remainingHP, destroyed } = msg.payload;
          s.applyHit(targetPlayerId, tankIndex, isKingShot, remainingHP, destroyed);
          break;
        }

        case WS_MESSAGES.GAME_OVER:
          s.setGameOverData(msg.payload);
          s.setPhase(GAME_PHASES.GAME_OVER);
          break;

        case WS_MESSAGES.ERROR:
          s.setError(msg.payload.message);
          s.addToast(msg.payload.message, 'error');
          s.setReconnecting(false);
          break;

        case WS_MESSAGES.PLAYER_DISCONNECTED:
          s.addToast('Opponent disconnected. Waiting for reconnect...', 'warning');
          break;

        case WS_MESSAGES.PLAYER_RECONNECTED:
          s.addToast('Opponent reconnected!', 'success');
          break;

        case WS_MESSAGES.SYNC_STATE:
          s.syncState(msg.payload);
          s.setConnected(true);
          s.setReconnecting(false);
          break;

        case WS_MESSAGES.PONG:
          break;

        default:
          console.log('Unknown message:', msg.type);
      }
    };

    const removeHandler = addMessageHandler(handleMessage);

    connect(
      () => {
        const s = storeRef.current;
        s.setConnected(true);
        s.setReconnecting(false);
      },
      () => {
        const s = storeRef.current;
        s.setConnected(false);
        s.setReconnecting(Boolean(s.roomCode && s.playerId));
      },
      () => {
        const s = storeRef.current;
        if (!s.roomCode || !s.playerId) {
          s.addToast('Connection error', 'error');
        }
      }
    );

    return () => {
      removeHandler();
      disconnect();
    };
  }, []);

  const createRoom = useCallback((playerName, options = {}) => {
    sendMessage(WS_MESSAGES.CREATE_ROOM, {
      playerName,
      drawingTimeSeconds: Number(options.drawingTimeSeconds) || undefined,
    });
  }, []);

  const joinRoom = useCallback((roomCode, playerName) => {
    sendMessage(WS_MESSAGES.JOIN_ROOM, { roomCode: roomCode.toUpperCase(), playerName });
  }, []);

  const submitDrawings = useCallback((tanks, bullets) => {
    sendMessage(WS_MESSAGES.SUBMIT_DRAWINGS, { tanks, bullets });
  }, []);

  const selectKing = useCallback((tankIndex) => {
    sendMessage(WS_MESSAGES.SELECT_KING, { tankIndex });
  }, []);

  const rollDice = useCallback((options = {}) => {
    sendMessage(WS_MESSAGES.ROLL_DICE, { useBonus: !!options.useBonus });
  }, []);

  return { createRoom, joinRoom, submitDrawings, selectKing, rollDice };
}
