'use client';
import { useState, useEffect } from 'react';
import useGameStore from '@/stores/gameStore';

export default function Lobby({ onCreateRoom, onJoinRoom }) {
  const [mode, setMode] = useState(null);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const connected = useGameStore((s) => s.connected);
  const error = useGameStore((s) => s.error);

  const handleCreate = () => {
    if (!name.trim()) return;
    setLoading(true);
    onCreateRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return;
    setLoading(true);
    onJoinRoom(roomCode.trim().toUpperCase(), name.trim());
  };

  useEffect(() => {
    if (error) setLoading(false);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pixel-grid-bg"
      style={{ background: 'var(--bg-primary)' }}>

      <div className="relative z-10 w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-12 animate-slide-down">
          <h1 className="font-pixel text-3xl sm:text-4xl mb-2 animate-flicker"
            style={{ color: 'var(--accent)' }}>
            ROLLIN&apos;
          </h1>
          <h1 className="font-pixel text-4xl sm:text-5xl mb-6"
            style={{ color: 'var(--king-gold)' }}>
            TANKS
          </h1>
          <p className="font-pixel text-[8px] sm:text-[10px] tracking-widest"
            style={{ color: 'var(--text-secondary)' }}>
            {'>> DRAW. ROLL. DESTROY. <<'}
          </p>
        </div>

        {/* Connection status */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-2 h-2 transition-colors duration-500 ${connected ? '' : 'animate-blink'}`}
            style={{ background: connected ? 'var(--success)' : 'var(--danger)' }} />
          <span className="font-pixel text-[8px]" style={{ color: 'var(--text-secondary)' }}>
            {connected ? 'ONLINE' : 'CONNECTING...'}
          </span>
        </div>

        {!mode ? (
          <div className="animate-fade-in space-y-5">
            <input
              type="text"
              className="input-pixel text-center"
              placeholder="ENTER YOUR NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                className="btn-pixel py-4"
                disabled={!name.trim() || !connected}
                onClick={() => setMode('create')}
              >
                CREATE
              </button>
              <button
                className="btn-pixel-secondary py-4"
                disabled={!name.trim() || !connected}
                onClick={() => setMode('join')}
              >
                JOIN
              </button>
            </div>
          </div>
        ) : mode === 'create' ? (
          <div className="animate-fade-in pixel-panel p-8">
            <button
              className="font-pixel text-[8px] mb-6 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--accent)' }}
              onClick={() => { setMode(null); setLoading(false); }}
            >
              {'< BACK'}
            </button>
            <h2 className="font-pixel text-sm mb-2" style={{ color: 'var(--accent)' }}>
              CREATE ROOM
            </h2>
            <p className="text-xs mb-6 font-mono" style={{ color: 'var(--text-secondary)' }}>
              Share the code with your friend
            </p>
            <div className="p-3 mb-6" style={{
              background: 'var(--bg-primary)',
              border: '2px solid var(--pixel-border)',
            }}>
              <p className="font-pixel text-[8px]">
                PLAYER: <span style={{ color: 'var(--accent)' }}>{name}</span>
              </p>
            </div>
            <button
              className="btn-pixel w-full py-4"
              disabled={loading || !connected}
              onClick={handleCreate}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent animate-spin" />
                  LOADING...
                </span>
              ) : (
                'CREATE ROOM'
              )}
            </button>
          </div>
        ) : (
          <div className="animate-fade-in pixel-panel p-8">
            <button
              className="font-pixel text-[8px] mb-6 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--accent)' }}
              onClick={() => { setMode(null); setLoading(false); }}
            >
              {'< BACK'}
            </button>
            <h2 className="font-pixel text-sm mb-2" style={{ color: 'var(--accent)' }}>
              JOIN ROOM
            </h2>
            <p className="text-xs mb-6 font-mono" style={{ color: 'var(--text-secondary)' }}>
              Enter the room code from your friend
            </p>
            <input
              type="text"
              className="input-pixel text-center text-lg tracking-[0.5em] uppercase mb-4"
              placeholder="CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              autoFocus
            />
            <div className="p-3 mb-6" style={{
              background: 'var(--bg-primary)',
              border: '2px solid var(--pixel-border)',
            }}>
              <p className="font-pixel text-[8px]">
                PLAYER: <span style={{ color: 'var(--accent)' }}>{name}</span>
              </p>
            </div>
            <button
              className="btn-pixel w-full py-4"
              disabled={loading || !connected || roomCode.length < 4}
              onClick={handleJoin}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent animate-spin" />
                  JOINING...
                </span>
              ) : (
                'JOIN ROOM'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
