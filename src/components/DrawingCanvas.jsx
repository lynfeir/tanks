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
}) {
  const canvasContainerRef = useRef(null);
  const canvasElRef = useRef(null);

  useEffect(() => {
    if (canvasElRef.current) {
      initCanvas(canvasElRef.current);
    }
  }, [initCanvas]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Canvas */}
      <div
        ref={canvasContainerRef}
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: '3px solid rgba(255, 107, 53, 0.3)',
          background: 'rgba(10, 10, 26, 0.9)',
          boxShadow: '0 0 30px rgba(255, 107, 53, 0.1)',
        }}
      >
        <canvas
          ref={canvasElRef}
          className="w-full max-w-[400px] aspect-[4/3] cursor-crosshair touch-none"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
        {/* Grid overlay for guidance */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Tool selection */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(10, 10, 26, 0.6)' }}>
          <button
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              tool === 'brush' ? 'text-white' : 'opacity-50 hover:opacity-80'
            }`}
            style={tool === 'brush' ? { background: 'var(--accent)' } : {}}
            onClick={() => setTool('brush')}
          >
            Brush
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              tool === 'eraser' ? 'text-white' : 'opacity-50 hover:opacity-80'
            }`}
            style={tool === 'eraser' ? { background: 'var(--accent)' } : {}}
            onClick={() => setTool('eraser')}
          >
            Eraser
          </button>
        </div>

        {/* Brush sizes */}
        <div className="flex gap-2 items-center">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              className={`rounded-full transition-all ${
                brushSize === size ? 'ring-2 ring-offset-2 ring-offset-transparent' : 'opacity-50 hover:opacity-80'
              }`}
              style={{
                width: Math.max(size * 2, 16),
                height: Math.max(size * 2, 16),
                background: brushSize === size ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                ringColor: 'var(--accent)',
              }}
              onClick={() => setBrushSize(size)}
            />
          ))}
        </div>

        {/* Undo / Clear */}
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            onClick={undo}
            title="Undo"
          >
            Undo
          </button>
          <button
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(255, 71, 87, 0.2)', color: 'var(--danger)' }}
            onClick={clearCanvas}
            title="Clear"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Color palette */}
      <div className="flex flex-wrap gap-2 justify-center max-w-[400px]">
        {COLOR_PALETTE.map((color) => (
          <button
            key={color}
            className={`w-8 h-8 rounded-lg transition-all ${
              brushColor === color && tool === 'brush' ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
            }`}
            style={{
              background: color,
              border: color === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : 'none',
            }}
            onClick={() => {
              setBrushColor(color);
              setTool('brush');
            }}
          />
        ))}
      </div>
    </div>
  );
}
