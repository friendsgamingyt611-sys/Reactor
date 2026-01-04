import React from 'react';

interface Point {
  t: number;
  x: number;
  y: number;
  v: number;
  a: number;
}

interface PlayAreaProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  points: { a: { x: number; y: number }; b: { x: number; y: number } };
  gameState: string;
  isHoldingA: boolean;
  path: Point[];
  replayCursor: { x: number; y: number } | null;
  results: any;
}

const PlayArea: React.FC<PlayAreaProps> = ({
  containerRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  points,
  gameState,
  isHoldingA,
  path,
  replayCursor,
  results
}) => {

  const getVelocityColor = (v: number, maxV: number) => {
    const ratio = Math.min(v / (maxV || 1), 1);
    const r = Math.floor(ratio * 255);
    const g = Math.floor((1 - ratio) * 200);
    const b = Math.floor((1 - ratio) * 255);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div 
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="flex-grow relative overflow-hidden"
    >
      {/* Origin A */}
      <div 
        className={`absolute w-32 h-32 -ml-16 -mt-16 rounded-full flex items-center justify-center transition-all duration-300 ${['results', 'replay', 'analysis'].includes(gameState) ? 'opacity-20 grayscale' : 'opacity-100'}`}
        style={{ left: points.a.x, top: points.a.y }}
      >
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isHoldingA ? 'bg-amber-500/20 blur-2xl scale-125' : 'bg-blue-500/5 blur-xl scale-100'}`} />
        <div className={`absolute inset-2 rounded-full border transition-all duration-300 ${isHoldingA ? 'border-amber-500/60 scale-105 shadow-[0_0_40px_rgba(245,158,11,0.6)]' : 'border-blue-500/30 scale-100 animate-pulse'}`} style={{ borderStyle: 'solid' }} />
        <div className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center font-black text-xs transition-all duration-200 z-10 ${isHoldingA ? 'bg-amber-600 border-white scale-95 shadow-[0_0_50px_rgba(245,158,11,1),inset_0_0_20px_rgba(255,255,255,0.5)] text-white' : 'bg-black/40 border-blue-500 text-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.4),inset_0_0_10px_rgba(59,130,246,0.2)] hover:scale-105'}`}>
           <span className="relative z-10 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] tracking-widest">{gameState === 'holding' ? 'READY' : 'A'}</span>
        </div>
      </div>

      {/* Target B */}
      <div 
        className={`absolute w-16 h-16 -ml-8 -mt-8 rounded-full border-2 border-red-500/80 flex items-center justify-center transition-all duration-0 ${gameState === 'active' || gameState === 'replay' || gameState === 'analysis' ? 'opacity-100 scale-100 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'opacity-0 scale-0'}`}
        style={{ left: points.b.x, top: points.b.y }}
      >
        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
      </div>

      {/* Real-time Path */}
      {gameState !== 'replay' && gameState !== 'analysis' && (
           <svg className="absolute inset-0 pointer-events-none w-full h-full">
           {path.map((p, i) => {
             if (i === 0) return null;
             const prev = path[i - 1];
             if (!prev) return null;
             return (
               <line 
                 key={i}
                 x1={prev.x} y1={prev.y}
                 x2={p.x} y2={p.y}
                 stroke={getVelocityColor(p.v, results?.peakV || 1.5)}
                 strokeWidth={2 + (p.v * 8)}
                 strokeLinecap="round"
                 opacity={0.9}
               />
             );
           })}
         </svg>
      )}

      {/* Replay Elements */}
      {gameState === 'replay' && replayCursor && (
          <>
              <svg className="absolute inset-0 pointer-events-none w-full h-full">
                  <polyline 
                      points={path.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#333"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                  />
                  <circle cx={replayCursor.x} cy={replayCursor.y} r={12} fill="rgba(0, 255, 255, 0.3)" className="blur-md" />
                  <circle cx={replayCursor.x} cy={replayCursor.y} r={6} fill="white" className="shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </svg>
          </>
      )}
    </div>
  );
};

export default PlayArea;