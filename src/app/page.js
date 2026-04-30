'use client';
import { useEffect, useState } from 'react';
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
import HUD from '@/components/HUD';
import HelpOverlay from '@/components/HelpOverlay';
import { GAME_PHASES } from '@/lib/constants';

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const roomCode = useGameStore((s) => s.roomCode);
  const players = useGameStore((s) => s.players);
  const reconnecting = useGameStore((s) => s.reconnecting);
  const isSpectator = useGameStore((s) => s.isSpectator);
  const [helpOpen, setHelpOpen] = useState(false);

  const { createRoom, joinRoom, submitDrawings, selectKing, rollDice } = useWebSocket();

  const playerCount = Object.keys(players).length;
  const inLobbyWaiting = phase === GAME_PHASES.LOBBY && roomCode && playerCount < 2 && !isSpectator;

  // Handle King Selection with store update
  const handleSelectKing = (tankIndex) => {
    useGameStore.getState().selectKing(tankIndex);
    selectKing(tankIndex);
  };

  return (
    <main className="relative">
      <ToastContainer />
      <HUD onOpenHelp={() => setHelpOpen(true)} />
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />

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
      {phase === GAME_PHASES.LOBBY && !roomCode && !isSpectator && (
        <Lobby onCreateRoom={createRoom} onJoinRoom={joinRoom} />
      )}

      {inLobbyWaiting && <WaitingRoom />}

      {/* Spectator placeholders for pre-battle phases */}
      {isSpectator && phase !== GAME_PHASES.BATTLE && phase !== GAME_PHASES.GAME_OVER && (
        <SpectatorWaiting phase={phase} />
      )}

      {phase === GAME_PHASES.DRAWING && !isSpectator && (
        <ErrorBoundary>
          <DrawingPhase onSubmit={submitDrawings} />
        </ErrorBoundary>
      )}

      {phase === GAME_PHASES.KING_SELECTION && !isSpectator && (
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

function SpectatorWaiting({ phase }) {
  const messages = {
    [GAME_PHASES.LOBBY]: 'JOINING ROOM...',
    [GAME_PHASES.DRAWING]: 'PLAYERS ARE DRAWING THEIR TANKS',
    [GAME_PHASES.KING_SELECTION]: 'PLAYERS ARE CHOOSING THEIR KING',
  };
  const subtext = {
    [GAME_PHASES.LOBBY]: 'Connecting to match...',
    [GAME_PHASES.DRAWING]: 'Battle starts when both players finish.',
    [GAME_PHASES.KING_SELECTION]: 'Each player crowns one tank as king.',
  };
  return (
    <div className="min-h-screen flex items-center justify-center pixel-grid-bg p-4"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="pixel-panel p-8 text-center max-w-md">
        <div className="font-pixel text-[10px] mb-3" style={{ color: 'var(--king-gold)' }}>
          {'[ SPECTATING ]'}
        </div>
        <h2 className="font-pixel text-sm mb-4" style={{ color: 'var(--accent)' }}>
          {messages[phase] || 'WAITING...'}
        </h2>
        <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          {subtext[phase] || 'Please stand by.'}
        </p>
        <div className="font-pixel text-[8px] mt-6 animate-blink" style={{ color: 'var(--text-secondary)' }}>
          . . .
        </div>
      </div>
    </div>
  );
}
