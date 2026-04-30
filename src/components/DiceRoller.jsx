'use client';
import { useState, useEffect, useRef } from 'react';

const DICE_FACES = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
};

function DiceFace({ value, rolling, settled, delay = 0 }) {
  const dots = DICE_FACES[value] || [];

  return (
    <div className="relative" style={{ perspective: '800px' }}>
      <div
        className={`w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center ${
          rolling ? 'animate-spin3d' : settled ? 'animate-dice-land' : ''
        }`}
        style={{
          animationDelay: `${delay}ms`,
          background: rolling ? 'var(--accent)' : '#f4f4f4',
          border: `4px solid ${rolling ? 'var(--king-gold)' : '#1a1a2e'}`,
          boxShadow: rolling
            ? '0 0 30px rgba(255, 102, 0, 0.6), inset -3px -3px 0 rgba(0,0,0,0.2)'
            : '0 6px 0 0 #aaa, 0 8px 0 0 #444, inset -3px -3px 0 rgba(0,0,0,0.15), inset 3px 3px 0 rgba(255,255,255,0.6)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {!rolling && (
          <div className="grid grid-cols-3 grid-rows-3 gap-1 w-14 h-14 sm:w-16 sm:h-16 p-1.5">
            {Array.from({ length: 9 }, (_, i) => {
              const row = Math.floor(i / 3);
              const col = i % 3;
              const hasDot = dots.some(([r, c]) => r === row && c === col);
              return (
                <div key={i} className="flex items-center justify-center">
                  {hasDot && (
                    <div
                      style={{
                        width: '85%',
                        height: '85%',
                        background: '#1a1a2e',
                        boxShadow: 'inset -1px -1px 0 rgba(0,0,0,0.4), inset 1px 1px 0 rgba(255,255,255,0.2)',
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
  const [settled, setSettled] = useState(false);
  const onRollCompleteRef = useRef(onRollComplete);
  onRollCompleteRef.current = onRollComplete;

  useEffect(() => {
    if (rolling) {
      setShowResult(false);
      setSettled(false);
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
          setSettled(true);
          onRollCompleteRef.current?.();
        }
      }, 1500);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else if (result) {
      setDisplayValues([result.roll1, result.roll2]);
      setShowResult(true);
      setSettled(true);
    }
  }, [rolling, result]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-6 sm:gap-8">
        <div className="flex flex-col items-center gap-2">
          <DiceFace value={displayValues[0]} rolling={rolling} settled={settled} />
          <div className={`transition-all duration-300 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="font-pixel text-[8px] text-center" style={{ color: 'var(--success)' }}>
              {label1 || 'YOUR TANK'}
            </div>
            <div className="font-pixel text-[7px] mt-1 text-center"
              style={{ color: 'var(--text-secondary)' }}>
              #{displayValues[0]}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="font-pixel text-base font-bold animate-blink"
            style={{ color: rolling ? 'var(--king-gold)' : 'var(--pixel-border)' }}>
            VS
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <DiceFace value={displayValues[1]} rolling={rolling} settled={settled} delay={150} />
          <div className={`transition-all duration-300 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="font-pixel text-[8px] text-center" style={{ color: 'var(--danger)' }}>
              {label2 || 'ENEMY TANK'}
            </div>
            <div className="font-pixel text-[7px] mt-1 text-center"
              style={{ color: 'var(--text-secondary)' }}>
              #{displayValues[1]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
