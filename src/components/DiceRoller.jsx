'use client';
import { useState, useEffect } from 'react';

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
    <div className="relative" style={{ perspective: '800px' }}>
      <div
        className={`w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center ${
          rolling ? 'animate-spin3d' : 'animate-dice-land'
        }`}
        style={{
          animationDelay: `${delay}ms`,
          background: rolling ? 'var(--accent)' : '#e8e8e8',
          border: rolling ? '3px solid var(--king-gold)' : '3px solid #333',
          boxShadow: rolling
            ? '0 0 30px rgba(255, 102, 0, 0.5)'
            : '0 4px 0 0 #999, 0 6px 0 0 #333',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {!rolling && (
          <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-14 h-14 sm:w-16 sm:h-16 p-1">
            {Array.from({ length: 9 }, (_, i) => {
              const row = Math.floor(i / 3);
              const col = i % 3;
              const hasDot = dots.some(([r, c]) => r === row && c === col);
              return (
                <div key={i} className="flex items-center justify-center">
                  {hasDot && (
                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                      style={{ background: '#1a1a2e' }} />
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
      const interval = setInterval(() => {
        setDisplayValues([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
      }, 80);

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
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-6 sm:gap-8">
        <div className="flex flex-col items-center gap-2">
          <DiceFace value={displayValues[0]} rolling={rolling} />
          <span className={`font-pixel text-[8px] transition-all duration-300 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{ color: 'var(--success)' }}>
            {label1 || 'YOUR TANK'}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="font-pixel text-base"
            style={{ color: 'var(--pixel-border)' }}>
            VS
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <DiceFace value={displayValues[1]} rolling={rolling} delay={150} />
          <span className={`font-pixel text-[8px] transition-all duration-300 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{ color: 'var(--danger)' }}>
            {label2 || 'ENEMY TANK'}
          </span>
        </div>
      </div>
    </div>
  );
}
