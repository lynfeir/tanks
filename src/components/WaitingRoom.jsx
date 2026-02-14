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
      // Fallback
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-10 max-w-md w-full text-center animate-fade-in">
        <h2 className="text-2xl font-bold mb-2">Waiting for Opponent</h2>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Share this code with your friend
        </p>

        {/* Room Code Display */}
        <div
          className="relative mb-6 cursor-pointer group"
          onClick={copyCode}
        >
          <div className="text-5xl font-mono font-black tracking-[0.4em] py-6 rounded-2xl transition-all"
            style={{
              background: 'rgba(10, 10, 26, 0.6)',
              border: '2px solid var(--accent)',
            }}
          >
            {roomCode}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-lg font-bold">
              {copied ? 'Copied!' : 'Click to Copy'}
            </span>
          </div>
        </div>

        {/* Players */}
        <div className="space-y-3 mb-8">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: playerList[i] ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: playerList[i] ? '1px solid rgba(46, 213, 115, 0.3)' : '1px dashed rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${playerList[i] ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-600'}`}>
                {playerList[i] ? 'P' + (i + 1) : '?'}
              </div>
              <span className={playerList[i] ? 'font-medium' : 'opacity-30'}>
                {playerList[i]?.name || 'Waiting...'}
              </span>
              {playerList[i] && (
                <span className="ml-auto text-xs text-green-400">Ready</span>
              )}
            </div>
          ))}
        </div>

        {/* Loading animation */}
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: 'var(--accent)',
                animation: `float 1.5s ease-in-out infinite ${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
