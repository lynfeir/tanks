'use client';
import { useEffect } from 'react';
import useGameStore from '@/stores/gameStore';
import useWebSocket from '@/hooks/useWebSocket';
import Lobby from '@/components/Lobby';
import WaitingRoom from '@/components/WaitingRoom';
import DrawingPhase from '@/components/DrawingPhase';
import KingSelection from '@/components/KingSelection';
import BattleScene from '@/components/BattleScene';
import GameOverScreen from '@/components/GameOverScreen';
import ErrorBoundary from '@/components/ErrorBoundary';
import ToastContainer from '@/components/ui/Toast';
import { GAME_PHASES } from '@/lib/constants';

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const roomCode = useGameStore((s) => s.roomCode);
  const players = useGameStore((s) => s.players);
  const reconnecting = useGameStore((s) => s.reconnecting);

  const { createRoom, joinRoom, submitDrawings, selectKing, rollDice } = useWebSocket();

  const playerCount = Object.keys(players).length;
  const inLobbyWaiting = phase === GAME_PHASES.LOBBY && roomCode && playerCount < 2;

  // Handle King Selection with store update
  const handleSelectKing = (tankIndex) => {
    useGameStore.getState().selectKing(tankIndex);
    selectKing(tankIndex);
  };

  return (
    <main className="relative">
      <ToastContainer />

      {/* Reconnecting overlay */}
      {reconnecting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="pixel-panel p-8 text-center animate-fade-in">
            <div className="w-10 h-10 mx-auto mb-4 animate-spin"
              style={{
                border: '3px solid var(--accent)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
              }} />
            <h3 className="font-pixel text-sm mb-3" style={{ color: 'var(--accent)' }}>
              RECONNECTING...
            </h3>
            <p className="font-pixel text-[8px]" style={{ color: 'var(--text-secondary)' }}>
              REJOINING MATCH
            </p>
          </div>
        </div>
      )}

      {/* Phase rendering */}
      {phase === GAME_PHASES.LOBBY && !roomCode && (
        <Lobby onCreateRoom={createRoom} onJoinRoom={joinRoom} />
      )}

      {inLobbyWaiting && <WaitingRoom />}

      {phase === GAME_PHASES.DRAWING && (
        <ErrorBoundary>
          <DrawingPhase onSubmit={submitDrawings} />
        </ErrorBoundary>
      )}

      {phase === GAME_PHASES.KING_SELECTION && (
        <ErrorBoundary>
          <KingSelection onSelectKing={handleSelectKing} />
        </ErrorBoundary>
      )}

      {phase === GAME_PHASES.BATTLE && (
        <ErrorBoundary>
          <BattleScene onRollDice={rollDice} />
        </ErrorBoundary>
      )}

      {phase === GAME_PHASES.GAME_OVER && (
        <ErrorBoundary>
          <GameOverScreen />
        </ErrorBoundary>
      )}
    </main>
  );
}
