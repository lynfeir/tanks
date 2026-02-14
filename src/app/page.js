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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
          <div className="glass-card p-8 text-center animate-fade-in">
            <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            <h3 className="text-xl font-bold mb-2">Reconnecting...</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Trying to rejoin the game
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
        <DrawingPhase onSubmit={submitDrawings} />
      )}

      {phase === GAME_PHASES.KING_SELECTION && (
        <KingSelection onSelectKing={handleSelectKing} />
      )}

      {phase === GAME_PHASES.BATTLE && (
        <BattleScene onRollDice={rollDice} />
      )}

      {phase === GAME_PHASES.GAME_OVER && <GameOverScreen />}
    </main>
  );
}
