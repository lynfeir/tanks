'use client';
import { useState, useEffect } from 'react';
import useGameStore from '@/stores/gameStore';

export default function Lobby({ onCreateRoom, onJoinRoom }) {
  const [mode, setMode] = useState(null); // 'create' | 'join'
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
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--accent)', top: '10%', left: '15%', animation: 'float 6s ease-in-out infinite' }} />
        <div className="absolute w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ background: '#533483', bottom: '15%', right: '10%', animation: 'float 8s ease-in-out infinite reverse' }} />
        <div className="absolute w-64 h-64 rounded-full opacity-5 blur-3xl"
          style={{ background: '#2ed573', top: '50%', left: '50%', animation: 'float 7s ease-in-out infinite 1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-10 animate-slide-down">
          <h1 className="text-6xl font-black tracking-tight mb-2"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--king-gold))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
            }}>
            ROLLIN'
          </h1>
          <h1 className="text-7xl font-black tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, var(--king-gold), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            TANKS
          </h1>
          <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
            Draw. Roll. Destroy.
          </p>
        </div>

        {/* Connection status */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {connected ? 'Connected to server' : 'Connecting...'}
          </span>
        </div>

        {!mode ? (
          /* Mode Selection */
          <div className="animate-fade-in space-y-4">
            <input
              type="text"
              className="input-field text-center text-lg"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                className="btn-primary"
                disabled={!name.trim() || !connected}
                onClick={() => setMode('create')}
              >
                Create Game
              </button>
              <button
                className="btn-secondary"
                disabled={!name.trim() || !connected}
                onClick={() => setMode('join')}
              >
                Join Game
              </button>
            </div>
          </div>
        ) : mode === 'create' ? (
          /* Create Room */
          <div className="animate-fade-in glass-card p-8">
            <button
              className="text-sm mb-6 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
              onClick={() => { setMode(null); setLoading(false); }}
            >
              &#8592; Back
            </button>
            <h2 className="text-2xl font-bold mb-2">Create a Room</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Share the code with your friend to join
            </p>
            <p className="text-sm mb-4">Playing as: <strong>{name}</strong></p>
            <button
              className="btn-primary w-full"
              disabled={loading || !connected}
              onClick={handleCreate}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        ) : (
          /* Join Room */
          <div className="animate-fade-in glass-card p-8">
            <button
              className="text-sm mb-6 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
              onClick={() => { setMode(null); setLoading(false); }}
            >
              &#8592; Back
            </button>
            <h2 className="text-2xl font-bold mb-2">Join a Room</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Enter the room code from your friend
            </p>
            <input
              type="text"
              className="input-field text-center text-2xl tracking-[0.5em] uppercase font-mono mb-4"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              autoFocus
            />
            <p className="text-sm mb-4">Playing as: <strong>{name}</strong></p>
            <button
              className="btn-primary w-full"
              disabled={loading || !connected || roomCode.length < 4}
              onClick={handleJoin}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Joining...
                </span>
              ) : (
                'Join Room'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
