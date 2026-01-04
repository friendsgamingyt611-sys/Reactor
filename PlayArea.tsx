import React, { useMemo } from 'react';
import { X } from 'lucide-react';

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
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: () => void;
  points: { a: { x: number; y: number }; b: { x: number; y: number } };
  gameState: string;
  isHoldingA: boolean;
  path: Point[];
  results: any;
  replayTime?: number; // Optional, only for replay
  goTime?: number;     // Optional, only for replay
  violationPoint?: { x: number, y: number } | null;
}

const PlayArea: React.FC<PlayAreaProps> = ({
  containerRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  points,
  gameState,
  isHoldingA,
  path,
  results,
  replayTime = 0,
  goTime = 0,
  violationPoint
}) => {

  const getVelocityColor = (v: number, maxV: number) => {
    const ratio = Math.min(v / (maxV || 1), 1);
    const r = Math.floor(ratio * 255);
    const g = Math.floor((1 - ratio) * 200);
    const b = Math.floor((1 - ratio) * 255);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // --- REPLAY LOGIC ---
  const replayData = useMemo(() => {
    if (gameState !== 'replay') return null;

    const absReplayTime = goTime + replayTime;
    
    // Determine which points have happened by this time
    const visiblePoints = path.filter(p => p.t <= absReplayTime);
    
    // Determine Cursor Position
    let cursor = { x: points.a.x, y: points.a.y };
    let isReactionPhase = true;

    if (visiblePoints.length > 0) {
        // We have started moving
        cursor = { x: visiblePoints[visiblePoints.length-1].x, y: visiblePoints[visiblePoints.length-1].y };
        isReactionPhase = false;
    } 
    // If no points are visible yet, we are in reaction delay. Cursor stays at A.

    return { visiblePoints, cursor, isReactionPhase };
  }, [gameState, replayTime, goTime, path, points]);


  return (
    <div 
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      className="flex-grow relative overflow-hidden touch-none"
    >
      {/* Origin A - Always visible */}
      <div 
        className={`absolute w-32 h-32 -ml-16 -mt-16 rounded-full flex items-center justify-center transition-all duration-300 ${['results', 'replay', 'analysis', 'failed'].includes(gameState) ? 'opacity-20 grayscale' : 'opacity-100'}`}
        style={{ left: points.a.x, top: points.a.y }}
      >
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isHoldingA ? 'bg-amber-500/20 blur-2xl scale-125' : 'bg-blue-500/5 blur-xl scale-100'}`} />
        <div className={`absolute inset-2 rounded-full border transition-all duration-300 ${isHoldingA ? 'border-amber-500/60 scale-105 shadow-[0_0_40px_rgba(245,158,11,0.6)]' : 'border-blue-500/30 scale-100 animate-pulse'}`} style={{ borderStyle: 'solid' }} />
        <div className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center font-black text-xs transition-all duration-200 z-10 ${isHoldingA ? 'bg-amber-600 border-white scale-95 shadow-[0_0_50px_rgba(245,158,11,1),inset_0_0_20px_rgba(255,255,255,0.5)] text-white' : 'bg-black/40 border-blue-500 text-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.4),inset_0_0_10px_rgba(59,130,246,0.2)] hover:scale-105'}`}>
           <span className="relative z-10 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] tracking-widest">{gameState === 'holding' ? 'READY' : 'A'}</span>
        </div>
      </div>

      {/* Target B - Always visible in Replay/Results/Failed */}
      <div 
        className={`absolute w-16 h-16 -ml-8 -mt-8 rounded-full border-2 border-red-500/80 flex items-center justify-center transition-all duration-0 
        ${gameState === 'active' || gameState === 'analysis' ? 'opacity-100 scale-100' : ''}
        ${gameState === 'replay' || gameState === 'results' || gameState === 'failed' ? 'opacity-100 scale-100' : ''}
        ${gameState === 'idle' || gameState === 'holding' ? 'opacity-0 scale-0' : ''}
        shadow-[0_0_30px_rgba(239,68,68,0.6)]`}
        style={{ left: points.b.x, top: points.b.y }}
      >
        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
      </div>

      {/* Real-time Path (Active) */}
      {gameState === 'active' && (
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

      {/* Violation Marker */}
      {(gameState === 'failed' || gameState === 'replay') && violationPoint && (
          <div 
              className="absolute pointer-events-none z-50 text-red-500 animate-pulse"
              style={{ left: violationPoint.x - 12, top: violationPoint.y - 12 }}
          >
              <X size={24} strokeWidth={4} />
              <div className="absolute top-full left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-900/80 text-white text-[8px] px-1 py-0.5 rounded font-mono">VIOLATION</div>
          </div>
      )}

      {/* Replay Elements - Recreating original movement */}
      {gameState === 'replay' && replayData && (
          <>
              <svg className="absolute inset-0 pointer-events-none w-full h-full">
                  {/* Ideal Path Ghost */}
                   <line 
                    x1={points.a.x} y1={points.a.y} 
                    x2={points.b.x} y2={points.b.y} 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth="2" 
                    strokeDasharray="4 4" 
                   />

                  {/* The Dynamic Path "Growing" */}
                  {replayData.visiblePoints.map((p, i) => {
                      if (i === 0) return null;
                      const prev = replayData.visiblePoints[i - 1];
                      return (
                        <line 
                            key={i}
                            x1={prev.x} y1={prev.y}
                            x2={p.x} y2={p.y}
                            stroke={getVelocityColor(p.v, results?.peakV || 1.5)}
                            strokeWidth={3 + (p.v * 6)} 
                            strokeLinecap="round"
                            opacity={1}
                        />
                      );
                  })}
              </svg>

              {/* Cursor / Finger Indicator */}
              <div 
                className="absolute w-6 h-6 -ml-3 -mt-3 pointer-events-none z-50 transition-transform duration-75 ease-linear"
                style={{ left: replayData.cursor.x, top: replayData.cursor.y }}
              >
                  <div className={`absolute inset-0 bg-cyan-400 rounded-full blur-md ${replayData.isReactionPhase ? 'opacity-20 animate-pulse scale-150' : 'opacity-60 scale-100'}`}></div>
                  <div className="absolute inset-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]"></div>
              </div>
          </>
      )}
    </div>
  );
};

export default PlayArea;