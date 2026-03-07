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
      <div className="min-h-screen flex items-center justify-center pixel-grid-bg"
        style={{ background: 'var(--bg-primary)' }}>
        <div className="pixel-panel p-10 text-center animate-fade-in">
          <div className="font-pixel text-lg mb-4" style={{ color: 'var(--king-gold)' }}>
            [KING]
          </div>
          <h2 className="font-pixel text-sm mb-4" style={{ color: 'var(--king-gold)' }}>
            KING SELECTED!
          </h2>
          <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
            Waiting for opponent...
          </p>
          <div className="font-pixel text-[8px] mt-6 animate-blink" style={{ color: 'var(--text-secondary)' }}>
            PLEASE WAIT...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pixel-grid-bg"
      style={{ background: 'var(--bg-primary)' }}>

      <div className="relative z-10 w-full max-w-xl">
        <div className="text-center mb-8 animate-slide-down">
          <div className="font-pixel text-lg mb-4" style={{ color: 'var(--king-gold)' }}>
            [KING]
          </div>
          <h2 className="font-pixel text-base sm:text-lg mb-4" style={{ color: 'var(--king-gold)' }}>
            CHOOSE YOUR KING
          </h2>
          <p className="font-mono text-xs max-w-md mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}>
            The King can <span style={{ color: 'var(--king-gold)' }}>ONE-SHOT</span> any enemy,
            but has only <span style={{ color: 'var(--danger)' }}>1 HP</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 animate-fade-in">
          {myTanks.map((tank, i) => (
            <button
              key={i}
              className="relative p-3 transition-all duration-200"
              style={{
                background: selectedIndex === i
                  ? 'rgba(255, 204, 0, 0.1)'
                  : 'var(--bg-secondary)',
                border: selectedIndex === i
                  ? '3px solid var(--king-gold)'
                  : '3px solid var(--pixel-border)',
                boxShadow: selectedIndex === i
                  ? '0 0 15px rgba(255, 204, 0, 0.2)'
                  : 'none',
              }}
              onClick={() => setSelectedIndex(i)}
            >
              {selectedIndex === i && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 font-pixel text-[8px] z-10 px-1"
                  style={{
                    color: 'var(--king-gold)',
                    background: 'var(--bg-primary)',
                  }}>
                  [K]
                </div>
              )}

              <div className="w-full aspect-[4/3] mb-2"
                style={{
                  background: 'var(--bg-primary)',
                  backgroundImage: tank.imageUrl ? `url(${tank.imageUrl})` : 'none',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  border: '2px solid ' + (selectedIndex === i ? 'var(--king-gold)' : 'var(--pixel-border)'),
                }} />

              <div className="text-center">
                <span className="font-pixel text-[8px]" style={{
                  color: selectedIndex === i ? 'var(--king-gold)' : 'var(--text-primary)',
                }}>
                  TANK #{i + 1}
                </span>
                <div className="font-pixel text-[6px] mt-1"
                  style={{
                    color: selectedIndex === i ? 'var(--king-gold)' : 'var(--text-secondary)',
                  }}>
                  {selectedIndex === i ? '1HP/ONE-SHOT' : '2HP/STANDARD'}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            className="btn-pixel px-12 py-4"
            disabled={selectedIndex === null}
            onClick={handleConfirm}
            style={selectedIndex !== null ? {
              background: 'var(--king-gold)',
              boxShadow: '0 4px 0 0 #cc9900, 0 6px 0 0 #0a0a1a',
            } : {}}
          >
            {selectedIndex !== null ? `CROWN TANK #${selectedIndex + 1}` : 'SELECT A TANK'}
          </button>
        </div>
      </div>
    </div>
  );
}
