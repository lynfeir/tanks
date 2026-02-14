'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import DrawingCanvas from './DrawingCanvas';
import useDrawingCanvas from '@/hooks/useDrawingCanvas';
import useGameStore from '@/stores/gameStore';
import { TANKS_PER_PLAYER, DRAWING_TIME_SECONDS } from '@/lib/constants';

export default function DrawingPhase({ onSubmit }) {
  const canvas = useDrawingCanvas();
  const myTanks = useGameStore((s) => s.myTanks);
  const currentIndex = useGameStore((s) => s.currentDrawingIndex);
  const drawingType = useGameStore((s) => s.drawingType);
  const setMyTankDrawing = useGameStore((s) => s.setMyTankDrawing);
  const setMyBulletDrawing = useGameStore((s) => s.setMyBulletDrawing);
  const nextDrawing = useGameStore((s) => s.nextDrawing);
  const prevDrawing = useGameStore((s) => s.prevDrawing);
  const addToast = useGameStore((s) => s.addToast);

  const [timeLeft, setTimeLeft] = useState(DRAWING_TIME_SECONDS);
  const [submitted, setSubmitted] = useState(false);
  const prevDrawRef = useRef({ index: currentIndex, type: drawingType });

  // Timer
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  // Save current drawing before switching
  const saveCurrentDrawing = useCallback(() => {
    const dataUrl = canvas.getDataURL();
    const prev = prevDrawRef.current;
    if (prev.type === 'tank') {
      setMyTankDrawing(prev.index, dataUrl);
    } else {
      setMyBulletDrawing(prev.index, dataUrl);
    }
  }, [canvas, setMyTankDrawing, setMyBulletDrawing]);

  // Load drawing when index/type changes
  useEffect(() => {
    // Save previous
    if (prevDrawRef.current.index !== currentIndex || prevDrawRef.current.type !== drawingType) {
      saveCurrentDrawing();
    }
    prevDrawRef.current = { index: currentIndex, type: drawingType };

    // Load current
    const tank = myTanks[currentIndex];
    const dataUrl = drawingType === 'tank' ? tank?.imageUrl : tank?.bulletUrl;
    canvas.loadImage(dataUrl);
  }, [currentIndex, drawingType]);

  const handleNext = () => {
    saveCurrentDrawing();
    nextDrawing();
  };

  const handlePrev = () => {
    saveCurrentDrawing();
    prevDrawing();
  };

  const handleSubmit = useCallback(() => {
    if (submitted) return;

    // Save current drawing first
    const dataUrl = canvas.getDataURL();
    if (drawingType === 'tank') {
      setMyTankDrawing(currentIndex, dataUrl);
    } else {
      setMyBulletDrawing(currentIndex, dataUrl);
    }

    // Collect all drawings
    const state = useGameStore.getState();
    const tanks = state.myTanks.map((t) => t.imageUrl);
    const bullets = state.myTanks.map((t) => t.bulletUrl);

    // Update current one that was just saved
    if (drawingType === 'tank') {
      tanks[currentIndex] = dataUrl;
    } else {
      bullets[currentIndex] = dataUrl;
    }

    setSubmitted(true);
    onSubmit(tanks, bullets);
    addToast('Drawings submitted!', 'success');
  }, [submitted, canvas, drawingType, currentIndex, setMyTankDrawing, setMyBulletDrawing, onSubmit, addToast]);

  const totalDrawings = TANKS_PER_PLAYER * 2;
  const currentNumber = drawingType === 'tank'
    ? currentIndex + 1
    : TANKS_PER_PLAYER + currentIndex + 1;

  const isFirstDrawing = drawingType === 'tank' && currentIndex === 0;
  const isLastDrawing = drawingType === 'bullet' && currentIndex === TANKS_PER_PLAYER - 1;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center animate-fade-in">
          <div className="text-4xl mb-4 animate-float">&#9989;</div>
          <h2 className="text-2xl font-bold mb-2">Drawings Submitted!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Waiting for your opponent to finish...
          </p>
          <div className="flex justify-center gap-1 mt-6">
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
      {/* Header */}
      <div className="text-center animate-slide-down">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h2 className="text-2xl font-bold">
            Draw Your {drawingType === 'tank' ? `Tank #${currentIndex + 1}` : `Bullet #${currentIndex + 1}`}
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {drawingType === 'tank'
            ? 'Design a fearsome battle tank!'
            : `Design the ammo for Tank #${currentIndex + 1}`}
        </p>
      </div>

      {/* Timer and progress */}
      <div className="flex items-center gap-6">
        <div className={`text-lg font-mono font-bold ${timeLeft < 30 ? 'text-red-400 animate-pulse' : ''}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalDrawings }, (_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                background: i < currentNumber
                  ? 'var(--accent)'
                  : i === currentNumber - 1
                  ? 'var(--king-gold)'
                  : 'rgba(255,255,255,0.1)',
                transform: i === currentNumber - 1 ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="animate-fade-in">
        <DrawingCanvas {...canvas} />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button
          className="btn-secondary px-6"
          onClick={handlePrev}
          disabled={isFirstDrawing}
          style={isFirstDrawing ? { opacity: 0.3 } : {}}
        >
          &#8592; Prev
        </button>

        {isLastDrawing ? (
          <button className="btn-primary px-10" onClick={handleSubmit}>
            Submit All Drawings
          </button>
        ) : (
          <button className="btn-primary px-8" onClick={handleNext}>
            Next &#8594;
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 mt-2">
        <div className="flex gap-1 items-center">
          <span className="text-xs mr-2" style={{ color: 'var(--text-secondary)' }}>Tanks:</span>
          {myTanks.map((tank, i) => (
            <div
              key={`tank-${i}`}
              className={`w-10 h-8 rounded border cursor-pointer transition-all ${
                drawingType === 'tank' && currentIndex === i ? 'ring-2' : ''
              }`}
              style={{
                borderColor: tank.imageUrl ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                ringColor: 'var(--king-gold)',
                background: 'rgba(10, 10, 26, 0.6)',
                backgroundImage: tank.imageUrl ? `url(${tank.imageUrl})` : 'none',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
              onClick={() => {
                saveCurrentDrawing();
                useGameStore.setState({ currentDrawingIndex: i, drawingType: 'tank' });
              }}
            />
          ))}
        </div>
        <div className="flex gap-1 items-center ml-4">
          <span className="text-xs mr-2" style={{ color: 'var(--text-secondary)' }}>Bullets:</span>
          {myTanks.map((tank, i) => (
            <div
              key={`bullet-${i}`}
              className={`w-10 h-8 rounded border cursor-pointer transition-all ${
                drawingType === 'bullet' && currentIndex === i ? 'ring-2' : ''
              }`}
              style={{
                borderColor: tank.bulletUrl ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                ringColor: 'var(--king-gold)',
                background: 'rgba(10, 10, 26, 0.6)',
                backgroundImage: tank.bulletUrl ? `url(${tank.bulletUrl})` : 'none',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
              onClick={() => {
                saveCurrentDrawing();
                useGameStore.setState({ currentDrawingIndex: i, drawingType: 'bullet' });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
