import React, { useMemo } from 'react';

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
  results: any;
  replayTime?: number; // Optional, only for replay
  goTime?: number;     // Optional, only for replay
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
  results,
  replayTime = 0,
  goTime = 0
}) => {

  const getVelocityColor = (v: number, maxV: number) => {
    const ratio = Math.min(v / (maxV || 1), 1);
    const r = Math.floor(ratio * 255);
    const g = Math.floor((1 - ratio) * 200);
    const b = Math.floor((1 - ratio) * 255);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // --- REPLAY LOGIC ---
  // Filter path based on current replayTime
  const replayData = useMemo(() => {
    if (gameState !== 'replay') return null;

    const absReplayTime = goTime + replayTime;
    
    // 1. Determine Cursor Position
    let cursor = { x: points.a.x, y: points.a.y };
    
    // Find where we are
    // If replayTime is 0, we are at A. 
    // We only start moving when path points exist after goTime.
    
    // Filter points that have already occurred
    const visiblePoints = path.filter(p => p.t <= absReplayTime);
    
    if (visiblePoints.length > 0) {
        cursor = { x: visiblePoints[visiblePoints.length-1].x, y: visiblePoints[visiblePoints.length-1].y };
        
        // Interpolate for smoothness between the last visible point and the next invisible one
        // (Optional enhancement, sticking to raw point clamping for "real data" feel)
    } else {
        // We are in reaction time dead zone, stick to A
        cursor = { x: points.a.x, y: points.a.y };
    }

    return { visiblePoints, cursor };
  }, [gameState, replayTime, goTime, path, points]);


  return (
    <div 
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="flex-grow relative overflow-hidden"
    >
      {/* Origin A - Always visible */}
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

      {/* Target B - Replay Logic: Spawns at t=0 */}
      <div 
        className={`absolute w-16 h-16 -ml-8 -mt-8 rounded-full border-2 border-red-500/80 flex items-center justify-center transition-all duration-0 
        ${gameState === 'active' || gameState === 'analysis' ? 'opacity-100 scale-100' : ''}
        ${gameState === 'replay' ? (replayTime >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0') : ''}
        ${gameState === 'idle' || gameState === 'holding' || gameState === 'results' ? 'opacity-0 scale-0' : ''}
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
                            stroke={getVelocityColor(p.v, results.peakV)}
                            strokeWidth={2 + (p.v * 8)}
                            strokeLinecap="round"
                            opacity={0.9}
                        />
                      );
                  })}

                  {/* Cursor */}
                  <circle cx={replayData.cursor.x} cy={replayData.cursor.y} r={12} fill="rgba(0, 255, 255, 0.3)" className="blur-md" />
                  <circle cx={replayData.cursor.x} cy={replayData.cursor.y} r={6} fill="white" className="shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </svg>
          </>
      )}
    </div>
  );
};

export default PlayArea;