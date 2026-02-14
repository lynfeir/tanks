'use client';
import { useState, useEffect, useCallback } from 'react';

const DICE_FACES = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
};

function DiceFace({ value, rolling, delay = 0 }) {
  const dots = DICE_FACES[value] || [];

  return (
    <div
      className="relative w-24 h-24"
      style={{
        perspective: '600px',
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className={`w-full h-full rounded-2xl flex items-center justify-center ${
          rolling ? 'animate-spin3d' : ''
        }`}
        style={{
          background: rolling
            ? 'linear-gradient(135deg, var(--accent), var(--king-gold))'
            : 'linear-gradient(135deg, #ffffff, #e8e8e8)',
          boxShadow: rolling
            ? '0 0 30px var(--accent)'
            : '0 8px 25px rgba(0,0,0,0.3), inset 0 -2px 5px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
        }}
      >
        {!rolling && (
          <div className="grid grid-cols-3 grid-rows-3 gap-1 w-16 h-16 p-1">
            {Array.from({ length: 9 }, (_, i) => {
              const row = Math.floor(i / 3);
              const col = i % 3;
              const hasDot = dots.some(([r, c]) => r === row && c === col);
              return (
                <div key={i} className="flex items-center justify-center">
                  {hasDot && (
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{
                        background: '#1a1a2e',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiceRoller({ result, rolling, onRollComplete, label1, label2 }) {
  const [displayValues, setDisplayValues] = useState([1, 1]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (rolling) {
      setShowResult(false);
      // Rapid random values during roll
      const interval = setInterval(() => {
        setDisplayValues([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
      }, 100);

      // Stop after animation
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (result) {
          setDisplayValues([result.roll1, result.roll2]);
          setShowResult(true);
          if (onRollComplete) onRollComplete();
        }
      }, 1500);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else if (result) {
      setDisplayValues([result.roll1, result.roll2]);
      setShowResult(true);
    }
  }, [rolling, result]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <DiceFace value={displayValues[0]} rolling={rolling} />
          <span className={`text-sm font-bold transition-all ${showResult ? 'opacity-100' : 'opacity-0'}`}
            style={{ color: 'var(--accent)' }}>
            {label1 || 'Your Tank'}
          </span>
        </div>

        <div className="text-3xl font-black" style={{ color: 'var(--text-secondary)' }}>
          VS
        </div>

        <div className="flex flex-col items-center gap-2">
          <DiceFace value={displayValues[1]} rolling={rolling} delay={200} />
          <span className={`text-sm font-bold transition-all ${showResult ? 'opacity-100' : 'opacity-0'}`}
            style={{ color: 'var(--danger)' }}>
            {label2 || 'Enemy Tank'}
          </span>
        </div>
      </div>
    </div>
  );
}
