'use client';
import { useEffect, useRef } from 'react';
import { COLOR_PALETTE, BRUSH_SIZES } from '@/lib/constants';

export default function DrawingCanvas({
  initCanvas,
  startDrawing,
  draw,
  stopDrawing,
  clearCanvas,
  undo,
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  tool,
  setTool,
  drawingType,
}) {
  const canvasContainerRef = useRef(null);
  const canvasElRef = useRef(null);

  useEffect(() => {
    if (canvasElRef.current) {
      initCanvas(canvasElRef.current);
    }
  }, [initCanvas]);

  const showFacingHint = drawingType === 'tank';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Canvas frame */}
      <div
        ref={canvasContainerRef}
        className="relative"
        style={{
          padding: 0,
          background: 'var(--bg-primary)',
          border: '4px solid var(--pixel-border)',
          boxShadow:
            'inset -2px -2px 0 0 #111133, inset 2px 2px 0 0 #2a2a50, 0 4px 0 0 #0a0a1a',
        }}
      >
        <canvas
          ref={canvasElRef}
          className="block w-full max-w-[400px] aspect-[4/3] cursor-crosshair touch-none"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          style={{ background: '#fafafa' }}
        />

        {/* Pixel grid overlay (dark canvas grid) */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Center line + facing-direction indicator (only for TANK drawings) */}
        {showFacingHint && (
          <>
            <div className="absolute inset-y-0 pointer-events-none"
              style={{
                left: '50%',
                width: 1,
                background: 'rgba(0, 0, 0, 0.12)',
              }}
            />
            <div className="absolute pointer-events-none"
              style={{
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 102, 0, 0.85)',
                color: '#fff',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '7px',
                padding: '4px 6px',
                letterSpacing: '1px',
              }}
            >
              FRONT {'>'}
            </div>
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Tool selection */}
        <div className="flex"
          style={{ background: 'var(--bg-primary)', border: '2px solid var(--pixel-border)' }}>
          <button
            className="px-4 py-2 font-pixel text-[8px] transition-all"
            style={{
              background: tool === 'brush' ? 'var(--accent)' : 'transparent',
              color: tool === 'brush' ? '#fff' : 'var(--text-secondary)',
            }}
            onClick={() => setTool('brush')}
          >
            BRUSH
          </button>
          <button
            className="px-4 py-2 font-pixel text-[8px] transition-all"
            style={{
              background: tool === 'eraser' ? 'var(--accent)' : 'transparent',
              color: tool === 'eraser' ? '#fff' : 'var(--text-secondary)',
            }}
            onClick={() => setTool('eraser')}
          >
            ERASER
          </button>
        </div>

        {/* Brush sizes */}
        <div className="flex gap-2 items-center">
          {BRUSH_SIZES.map((size) => {
            const selected = brushSize === size;
            return (
              <button
                key={size}
                className="transition-all flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  background: 'var(--bg-primary)',
                  border: `2px solid ${selected ? 'var(--accent)' : 'var(--pixel-border)'}`,
                  boxShadow: selected ? '0 0 6px rgba(255, 102, 0, 0.45)' : 'none',
                }}
                onClick={() => setBrushSize(size)}
                aria-label={`Brush size ${size}`}
              >
                <span style={{
                  display: 'block',
                  width: Math.min(size * 1.5, 18),
                  height: Math.min(size * 1.5, 18),
                  background: selected ? 'var(--accent)' : 'var(--text-secondary)',
                }} />
              </button>
            );
          })}
        </div>

        {/* Undo / Clear */}
        <div className="flex gap-2">
          <button
            className="px-3 py-2 font-pixel text-[8px] transition-all"
            style={{
              background: 'var(--bg-primary)',
              border: '2px solid var(--pixel-border)',
              color: 'var(--text-primary)',
            }}
            onClick={undo}
          >
            UNDO
          </button>
          <button
            className="px-3 py-2 font-pixel text-[8px] transition-all"
            style={{
              background: 'var(--bg-primary)',
              border: '2px solid var(--danger)',
              color: 'var(--danger)',
            }}
            onClick={clearCanvas}
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Color palette */}
      <div className="flex flex-wrap gap-1 justify-center max-w-[400px]"
        style={{ padding: 6, background: 'var(--bg-primary)', border: '2px solid var(--pixel-border)' }}>
        {COLOR_PALETTE.map((color) => {
          const selected = brushColor === color && tool === 'brush';
          return (
            <button
              key={color}
              className="transition-all"
              style={{
                width: 24,
                height: 24,
                background: color,
                border: `2px solid ${selected ? '#fff' : 'rgba(0,0,0,0.4)'}`,
                outline: selected ? `2px solid var(--accent)` : 'none',
                outlineOffset: 0,
              }}
              onClick={() => {
                setBrushColor(color);
                setTool('brush');
              }}
              aria-label={`Color ${color}`}
            />
          );
        })}
      </div>
    </div>
  );
}
