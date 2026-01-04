import React from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, ChartArea } from 'lucide-react';

interface Point {
  t: number;
  x: number;
  y: number;
  v: number;
  a: number;
}

interface PathAnalysisProps {
  path: Point[];
  points: { a: { x: number; y: number }; b: { x: number; y: number } };
  results: any;
  onBack: () => void;
}

const PathAnalysis: React.FC<PathAnalysisProps> = ({ path, points, results, onBack }) => {
  const getVelocityColor = (v: number, maxV: number) => {
    const ratio = Math.min(v / (maxV || 1), 1);
    const r = Math.floor(ratio * 255);
    const b = Math.floor((1 - ratio) * 255);
    return `rgb(${r}, 0, ${b})`;
  };

  // --- Deviation Analysis ---
  
  // 1. Max Deviation
  let maxDev = 0;
  let maxDevPoint = { x: 0, y: 0 };
  
  // Line params: ax + by + c = 0
  const L_A = points.a.y - points.b.y;
  const L_B = points.b.x - points.a.x;
  const L_C = points.a.x * points.b.y - points.b.x * points.a.y;
  const lenSq = L_A*L_A + L_B*L_B;

  path.forEach(p => {
      const dist = Math.abs(L_A * p.x + L_B * p.y + L_C) / Math.sqrt(lenSq);
      if (dist > maxDev) {
          maxDev = dist;
          maxDevPoint = { x: p.x, y: p.y };
      }
  });

  // 2. Area Deviation (Shoelace Formula)
  // Calculate area of polygon formed by Start -> Path -> End -> Start
  // Since path starts near A and ends near B, we close the loop by connecting last point to first point.
  // The 'Ideal' area is 0 (straight line). The calculated area is the deviation area.
  
  let area = 0;
  if (path.length > 2) {
      // Add start point A to the path for calculation if not exactly there
      const poly = [points.a, ...path, points.b, points.a];
      
      let sum = 0;
      for(let i = 0; i < poly.length - 1; i++) {
          sum += (poly[i].x * poly[i+1].y) - (poly[i+1].x * poly[i].y);
      }
      area = Math.abs(sum) / 2;
  }
  
  // Convert px² to meaningful unit (roughly cm² assuming ~160ppi)
  // 1 inch = 160px. 1cm = 63px. 1cm² = 3969px².
  const areaCm2 = area / 3969; 

  // SVG Path String for the filled area
  const svgPathString = `M ${points.a.x} ${points.a.y} ` + 
                        path.map(p => `L ${p.x} ${p.y}`).join(' ') + 
                        ` L ${points.b.x} ${points.b.y} Z`;

  return (
    <div className="absolute inset-0 bg-[#050505] z-50 flex flex-col">
       <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50 backdrop-blur-md">
           <button onClick={onBack} className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
               <ArrowLeft size={16} /> Back to Results
           </button>
           <h2 className="text-sm font-black italic uppercase tracking-tighter text-purple-400">Path Deviation Analysis</h2>
       </div>

       <div className="flex-grow relative overflow-hidden bg-grid-white/[0.02]">
            <div className="absolute inset-0 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }}>
            </div>

            <svg className="absolute inset-0 w-full h-full">
                {/* Deviation Area Fill */}
                <path d={svgPathString} fill="rgba(239, 68, 68, 0.1)" stroke="none" />

                {/* Ideal Line (Dashed) */}
                <line 
                    x1={points.a.x} y1={points.a.y} 
                    x2={points.b.x} y2={points.b.y} 
                    stroke="rgba(255,255,255,0.3)" 
                    strokeWidth="2" 
                    strokeDasharray="6 4" 
                />
                
                {/* Actual Path */}
                {path.map((p, i) => {
                    if (i === 0) return null;
                    const prev = path[i - 1];
                    return (
                        <line 
                            key={i}
                            x1={prev.x} y1={prev.y}
                            x2={p.x} y2={p.y}
                            stroke={getVelocityColor(p.v, results.peakV)}
                            strokeWidth="4"
                            strokeLinecap="round"
                            opacity={0.9}
                        />
                    );
                })}

                {/* Max Deviation Marker */}
                {maxDev > 0 && (
                    <>
                         <circle cx={maxDevPoint.x} cy={maxDevPoint.y} r={4} fill="none" stroke="#ef4444" strokeWidth="2" />
                    </>
                )}

                <circle cx={points.a.x} cy={points.a.y} r={4} fill="#3b82f6" />
                <circle cx={points.b.x} cy={points.b.y} r={4} fill="#ef4444" />
            </svg>

            {/* Labels */}
            {maxDev > 0 && (
                <div 
                    className="absolute bg-black/80 border border-red-500/50 rounded px-2 py-1 text-[8px] text-red-400 font-mono"
                    style={{ left: maxDevPoint.x + 10, top: maxDevPoint.y }}
                >
                    MAX DEV: {Math.round(maxDev)}px
                </div>
            )}
       </div>

       <div className="p-4 bg-black/80 border-t border-white/10 grid grid-cols-2 gap-4">
           <div>
               <p className="text-[9px] text-slate-500 uppercase font-black mb-2 flex items-center gap-1">
                   <TrendingUp size={10} /> Velocity Heatmap
               </p>
               <div className="h-2 rounded-full bg-gradient-to-r from-blue-700 to-red-600 w-full mb-1"></div>
               <div className="flex justify-between text-[8px] font-mono text-slate-400">
                   <span>SLOW</span>
                   <span>PEAK ({results.peakV.toFixed(1)}m/s)</span>
               </div>
           </div>
           
           <div>
                <p className="text-[9px] text-slate-500 uppercase font-black mb-2 flex items-center gap-1">
                   <AlertTriangle size={10} /> Metrics
                </p>
                <div className="flex justify-between text-[9px] font-mono text-slate-300">
                    <span>Path Efficiency:</span>
                    <span className="text-purple-400">{results.pathEfficiency.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-300 mt-1">
                    <span>Deviation Area:</span>
                    <span className="text-red-400 flex items-center gap-1">
                        <ChartArea size={8} />
                        {areaCm2.toFixed(2)} cm²
                    </span>
                </div>
           </div>
       </div>
    </div>
  );
};

export default PathAnalysis;