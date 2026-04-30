'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import DrawingCanvas from './DrawingCanvas';
import useDrawingCanvas from '@/hooks/useDrawingCanvas';
import useGameStore from '@/stores/gameStore';
import { TANKS_PER_PLAYER, DEFAULT_DRAWING_TIME } from '@/lib/constants';

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
  const drawingTimeSeconds = useGameStore((s) => s.drawingTimeSeconds);

  const [timeLeft, setTimeLeft] = useState(drawingTimeSeconds || DEFAULT_DRAWING_TIME);
  const [submitted, setSubmitted] = useState(false);
  const prevDrawRef = useRef({ index: currentIndex, type: drawingType });
  const handleSubmitRef = useRef(null);

  const handleSubmit = useCallback(() => {
    if (submitted) return;

    const dataUrl = canvas.getDataURL();
    if (drawingType === 'tank') {
      setMyTankDrawing(currentIndex, dataUrl);
    } else {
      setMyBulletDrawing(currentIndex, dataUrl);
    }

    const state = useGameStore.getState();
    const tanks = state.myTanks.map((t) => t.imageUrl);
    const bullets = state.myTanks.map((t) => t.bulletUrl);

    if (drawingType === 'tank') {
      tanks[currentIndex] = dataUrl;
    } else {
      bullets[currentIndex] = dataUrl;
    }

    setSubmitted(true);
    onSubmit(tanks, bullets);
    addToast('Drawings submitted!', 'success');
  }, [submitted, canvas, drawingType, currentIndex, setMyTankDrawing, setMyBulletDrawing, onSubmit, addToast]);

  handleSubmitRef.current = handleSubmit;

  // Timer (autocommit on expiry via ref to avoid handleSubmit dep churn)
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSubmitRef.current?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

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
    if (prevDrawRef.current.index !== currentIndex || prevDrawRef.current.type !== drawingType) {
      saveCurrentDrawing();
    }
    prevDrawRef.current = { index: currentIndex, type: drawingType };

    const tank = myTanks[currentIndex];
    const dataUrl = drawingType === 'tank' ? tank?.imageUrl : tank?.bulletUrl;
    canvas.loadImage(dataUrl);
    // canvas/myTanks/saveCurrentDrawing intentionally excluded — ref-stable + only want index/type triggers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, drawingType]);

  const handleNext = () => {
    saveCurrentDrawing();
    nextDrawing();
  };

  const handlePrev = () => {
    saveCurrentDrawing();
    prevDrawing();
  };

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
      <div className="min-h-screen flex items-center justify-center pixel-grid-bg"
        style={{ background: 'var(--bg-primary)' }}>
        <div className="pixel-panel p-10 text-center animate-fade-in max-w-md">
          <div className="font-pixel text-base mb-4" style={{ color: 'var(--success)' }}>
            {'>>> SUBMITTED <<<'}
          </div>
          <h2 className="font-pixel text-sm mb-4" style={{ color: 'var(--accent)' }}>
            DRAWINGS LOCKED IN
          </h2>
          <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
            Waiting for opponent to finish...
          </p>
          <div className="flex justify-center gap-1 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2"
                style={{
                  background: 'var(--accent)',
                  animation: `blink 1.4s step-end infinite ${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const lowTime = timeLeft < 30;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4 pixel-grid-bg"
      style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="text-center animate-slide-down">
        <div className="font-pixel text-[10px] mb-2" style={{ color: 'var(--text-secondary)' }}>
          {drawingType === 'tank' ? '[ DESIGN PHASE ]' : '[ AMMO PHASE ]'}
        </div>
        <h2 className="font-pixel text-base sm:text-lg" style={{ color: 'var(--accent)' }}>
          {drawingType === 'tank' ? `TANK #${currentIndex + 1}` : `BULLET #${currentIndex + 1}`}
        </h2>
        <p className="font-mono text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
          {drawingType === 'tank'
            ? 'Tank fires to the RIGHT. Design accordingly.'
            : `Ammo for Tank #${currentIndex + 1}`}
        </p>
      </div>

      {/* Timer + progress bar */}
      <div className="flex items-center gap-6">
        <div className="px-4 py-2"
          style={{
            background: 'var(--bg-primary)',
            border: `2px solid ${lowTime ? 'var(--danger)' : 'var(--pixel-border)'}`,
          }}>
          <span className={`font-pixel text-sm ${lowTime ? 'animate-blink' : ''}`}
            style={{ color: lowTime ? 'var(--danger)' : 'var(--accent)' }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalDrawings }, (_, i) => {
            const completed = i < currentNumber - 1;
            const current = i === currentNumber - 1;
            return (
              <div
                key={i}
                className="w-3 h-3 transition-all"
                style={{
                  background: completed
                    ? 'var(--success)'
                    : current
                    ? 'var(--accent)'
                    : 'var(--bg-primary)',
                  border: '1px solid ' + (current ? 'var(--accent)' : 'var(--pixel-border)'),
                  boxShadow: current ? '0 0 8px rgba(255, 102, 0, 0.5)' : 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div className="animate-fade-in">
        <DrawingCanvas {...canvas} drawingType={drawingType} />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button
          className="btn-pixel-secondary px-6"
          onClick={handlePrev}
          disabled={isFirstDrawing}
        >
          {'< PREV'}
        </button>

        {isLastDrawing ? (
          <button className="btn-pixel px-10" onClick={handleSubmit}>
            SUBMIT ALL
          </button>
        ) : (
          <button className="btn-pixel px-8" onClick={handleNext}>
            {'NEXT >'}
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-3 mt-2 flex-wrap justify-center">
        <div className="flex gap-1 items-center">
          <span className="font-pixel text-[8px] mr-2" style={{ color: 'var(--text-secondary)' }}>
            TANKS
          </span>
          {myTanks.map((tank, i) => {
            const isCurrent = drawingType === 'tank' && currentIndex === i;
            return (
              <button
                key={`tank-${i}`}
                className="w-10 h-8 transition-all relative"
                style={{
                  background: 'var(--bg-primary)',
                  border: '2px solid ' + (isCurrent
                    ? 'var(--accent)'
                    : tank.imageUrl
                    ? 'var(--success)'
                    : 'var(--pixel-border)'),
                  backgroundImage: tank.imageUrl ? `url(${tank.imageUrl})` : 'none',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  boxShadow: isCurrent ? '0 0 8px rgba(255, 102, 0, 0.5)' : 'none',
                }}
                onClick={() => {
                  saveCurrentDrawing();
                  useGameStore.setState({ currentDrawingIndex: i, drawingType: 'tank' });
                }}
              />
            );
          })}
        </div>
        <div className="flex gap-1 items-center">
          <span className="font-pixel text-[8px] mr-2" style={{ color: 'var(--text-secondary)' }}>
            AMMO
          </span>
          {myTanks.map((tank, i) => {
            const isCurrent = drawingType === 'bullet' && currentIndex === i;
            return (
              <button
                key={`bullet-${i}`}
                className="w-10 h-8 transition-all"
                style={{
                  background: 'var(--bg-primary)',
                  border: '2px solid ' + (isCurrent
                    ? 'var(--accent)'
                    : tank.bulletUrl
                    ? 'var(--success)'
                    : 'var(--pixel-border)'),
                  backgroundImage: tank.bulletUrl ? `url(${tank.bulletUrl})` : 'none',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  boxShadow: isCurrent ? '0 0 8px rgba(255, 102, 0, 0.5)' : 'none',
                }}
                onClick={() => {
                  saveCurrentDrawing();
                  useGameStore.setState({ currentDrawingIndex: i, drawingType: 'bullet' });
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
