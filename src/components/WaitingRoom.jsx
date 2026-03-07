'use client';
import { useState } from 'react';
import useGameStore from '@/stores/gameStore';

export default function WaitingRoom() {
  const roomCode = useGameStore((s) => s.roomCode);
  const players = useGameStore((s) => s.players);
  const [copied, setCopied] = useState(false);

  const playerList = Object.values(players);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = roomCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pixel-grid-bg"
      style={{ background: 'var(--bg-primary)' }}>

      <div className="pixel-panel p-10 max-w-md w-full text-center animate-fade-in relative z-10">
        <h2 className="font-pixel text-sm mb-2" style={{ color: 'var(--accent)' }}>
          WAITING FOR OPPONENT
        </h2>
        <p className="text-xs mb-8 font-mono" style={{ color: 'var(--text-secondary)' }}>
          Share this code with your friend
        </p>

        {/* Room Code Display */}
        <div className="relative mb-8 cursor-pointer group" onClick={copyCode}>
          <div className="font-pixel text-2xl sm:text-3xl tracking-[0.4em] py-6 transition-all"
            style={{
              background: 'var(--bg-primary)',
              border: '3px solid var(--accent)',
              boxShadow: '0 0 20px rgba(255, 102, 0, 0.2)',
              color: 'var(--accent)',
            }}>
            {roomCode}
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{ background: 'rgba(15, 15, 35, 0.85)' }}>
            <span className="font-pixel text-[10px]"
              style={{ color: copied ? 'var(--success)' : 'var(--accent)' }}>
              {copied ? 'COPIED!' : 'CLICK TO COPY'}
            </span>
          </div>
        </div>

        {/* Players */}
        <div className="space-y-3 mb-8">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 transition-all duration-500"
              style={{
                background: playerList[i] ? 'rgba(0, 255, 65, 0.05)' : 'var(--bg-primary)',
                border: playerList[i]
                  ? '2px solid rgba(0, 255, 65, 0.3)'
                  : '2px dashed var(--pixel-border)',
              }}>
              <div className="font-pixel text-[10px] w-8 h-8 flex items-center justify-center"
                style={{
                  background: playerList[i] ? 'rgba(0, 255, 65, 0.15)' : 'var(--bg-secondary)',
                  color: playerList[i] ? 'var(--success)' : 'var(--text-secondary)',
                  border: '2px solid ' + (playerList[i] ? 'var(--success)' : 'var(--pixel-border)'),
                }}>
                {playerList[i] ? `P${i + 1}` : '?'}
              </div>
              <span className="font-mono text-sm" style={{
                color: playerList[i] ? 'var(--text-primary)' : 'var(--text-secondary)',
                opacity: playerList[i] ? 1 : 0.4,
              }}>
                {playerList[i]?.name || 'Waiting...'}
              </span>
              {playerList[i] && (
                <span className="ml-auto font-pixel text-[8px]" style={{ color: 'var(--success)' }}>
                  READY
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div className="font-pixel text-[8px] animate-blink" style={{ color: 'var(--text-secondary)' }}>
          WAITING FOR PLAYER 2...
        </div>
      </div>
    </div>
  );
}
