'use client';
import { useState } from 'react';
import useGameStore from '@/stores/gameStore';

export default function KingSelection({ onSelectKing }) {
  const myTanks = useGameStore((s) => s.myTanks);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (selectedIndex === null) return;
    setConfirmed(true);
    onSelectKing(selectedIndex);
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center animate-fade-in">
          <div className="text-5xl mb-4 animate-crown-bounce">&#128081;</div>
          <h2 className="text-2xl font-bold mb-2">King Selected!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Waiting for opponent to choose their King...
          </p>
          <div className="flex justify-center gap-1 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: 'var(--king-gold)',
                  animation: `float 1.5s ease-in-out infinite ${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8 animate-slide-down">
        <div className="text-5xl mb-4 animate-crown-bounce">&#128081;</div>
        <h2 className="text-3xl font-bold mb-2">Choose Your King Tank</h2>
        <p style={{ color: 'var(--text-secondary)' }} className="max-w-md">
          The King Tank can <strong className="text-yellow-400">one-shot</strong> any enemy tank,
          but it only has <strong className="text-red-400">1 HP</strong>. Choose wisely!
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg animate-fade-in">
        {myTanks.map((tank, i) => (
          <button
            key={i}
            className={`relative rounded-2xl p-2 transition-all duration-300 ${
              selectedIndex === i ? 'animate-king-glow scale-105' : 'hover:scale-102'
            }`}
            style={{
              background: selectedIndex === i
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 107, 53, 0.2))'
                : 'rgba(10, 10, 26, 0.6)',
              border: selectedIndex === i
                ? '3px solid var(--king-gold)'
                : '2px solid rgba(255, 255, 255, 0.1)',
            }}
            onClick={() => setSelectedIndex(i)}
          >
            {/* Crown indicator */}
            {selectedIndex === i && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-crown-bounce">
                &#128081;
              </div>
            )}

            {/* Tank image */}
            <div
              className="w-full aspect-[4/3] rounded-xl mb-2"
              style={{
                background: 'rgba(10, 10, 26, 0.8)',
                backgroundImage: tank.imageUrl ? `url(${tank.imageUrl})` : 'none',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />

            <div className="text-center">
              <span className="text-sm font-bold">Tank #{i + 1}</span>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {selectedIndex === i ? '1 HP - One Shot Kill' : '2 HP - Standard'}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        className="btn-primary px-12 text-lg"
        disabled={selectedIndex === null}
        onClick={handleConfirm}
      >
        {selectedIndex !== null ? `Crown Tank #${selectedIndex + 1} as King` : 'Select a Tank'}
      </button>
    </div>
  );
}
