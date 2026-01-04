import React, { useMemo } from 'react';
import { Activity, Clock, Play, Pause, Square, Rewind, FastForward, Gauge, Wind, AlertTriangle } from 'lucide-react';

interface Point {
  t: number;
  x: number;
  y: number;
  v: number;
  a: number;
}

interface ReplayOverlayProps {
  replayTime: number;
  duration: number;
  results: any | null;
  replaySpeed: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onStop: () => void;
  path: Point[];
  startTime: number;
}

const ReplayOverlay: React.FC<ReplayOverlayProps> = ({
  replayTime,
  duration,
  results,
  replaySpeed,
  isPlaying,
  onTogglePlay,
  onSeek,
  onSpeedChange,
  onStop,
  path,
  startTime
}) => {
  
  // Calculate Live Data
  const liveData = useMemo(() => {
    const absTime = startTime + replayTime;
    // Find closest point before or at absTime
    // Assuming path is sorted by t
    let idx = 0;
    while(idx < path.length - 1 && path[idx+1].t <= absTime) {
      idx++;
    }
    const p = path[idx] || { v: 0, a: 0 };
    return { v: p.v, a: p.a };
  }, [replayTime, startTime, path]);

  const getBioPhaseText = () => {
      if (!results) return "VIOLATION ANALYSIS";

      const reactionMs = results.reactionTime;
      const t = replayTime;
      
      if (t < 20) return "Phase 0: Photoreception";
      if (t < 80) return "Phase 1: Signal Transit";
      if (t < Math.min(140, reactionMs)) return "Phase 2: Visual Processing";
      if (t < reactionMs) return "Phase 3: Motor Planning";
      if (t >= reactionMs && t < reactionMs + 50) return "Phase 4: Junction Firing";
      return "Phase 5: Ballistic Motion";
  };

  const getBioPhaseDesc = () => {
    if (!results) return "Analyzing failure path vector.";

    const reactionMs = results.reactionTime;
    const t = replayTime;
    
    if (t < 20) return "Retina converts photons to signals. Latency <20ms.";
    if (t < 80) return "Signal transits via optic nerve to Cortex.";
    if (t < reactionMs) return "Pre-motor cortex calculates trajectory.";
    if (t < reactionMs + 30) return "Acetylcholine released. Fibers recruited.";
    return "Peak velocity achieved. Cerebellum fine-tunes.";
  };

  return (
    <>
      {/* Player Controls - Moved to TOP to avoid blocking PlayArea */}
      <div className="absolute top-[88px] left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
          
          <div className="w-full max-w-2xl px-4 pointer-events-auto flex flex-col gap-2">
            
            {/* Main Control Bar */}
            <div className={`backdrop-blur-md border rounded-2xl p-3 shadow-2xl flex items-center gap-4 ${results ? 'bg-[#111]/90 border-white/10' : 'bg-red-950/90 border-red-500/30'}`}>
                
                 {/* Play/Pause */}
                 <button onClick={onTogglePlay} className="text-white hover:text-blue-400 transition-colors shrink-0">
                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                 </button>

                 {/* Timeline Slider */}
                 <div className="relative h-6 flex-grow flex items-center">
                       <input 
                          type="range" 
                          min="0" 
                          max={duration} 
                          value={replayTime}
                          onChange={(e) => onSeek(Number(e.target.value))}
                          className="absolute w-full h-full opacity-0 z-20 cursor-pointer"
                       />
                       
                       {/* Custom Track */}
                       <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                           {results && (
                               <>
                                   {/* Reaction Phase */}
                                   <div className="absolute h-full bg-yellow-500/30" style={{ width: `${(results.reactionTime / duration) * 100}%` }} />
                                   {/* Movement Phase */}
                                   <div className="absolute h-full bg-emerald-500/30" style={{ left: `${(results.reactionTime / duration) * 100}%`, right: 0 }} />
                               </>
                           )}
                           
                           {/* Progress Fill */}
                           <div className={`h-full relative ${results ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${(replayTime / duration) * 100}%` }} />
                       </div>
                       
                       {/* Thumb */}
                       <div className={`absolute h-3 w-3 bg-white rounded-full shadow-lg pointer-events-none border-2 top-1.5 ${results ? 'border-blue-500' : 'border-red-500'}`} style={{ left: `calc(${(replayTime / duration) * 100}% - 6px)` }} />
                 </div>

                 {/* Speed Toggle */}
                 <div className="flex bg-white/5 rounded-lg overflow-hidden shrink-0 border border-white/10">
                      <button onClick={() => onSpeedChange(0.1)} className={`px-2 py-1 text-[9px] font-mono ${replaySpeed === 0.1 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>0.1x</button>
                      <button onClick={() => onSpeedChange(1.0)} className={`px-2 py-1 text-[9px] font-mono ${replaySpeed === 1.0 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>1.0x</button>
                 </div>

                 {/* Close */}
                 <button onClick={onStop} className="text-slate-500 hover:text-red-400 transition-colors shrink-0">
                      <Square size={16} fill="currentColor" />
                 </button>
            </div>

            {/* Info Panel Row */}
            <div className="grid grid-cols-2 gap-2">
                 
                 {/* Live Kinematics HUD */}
                 <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-3 flex justify-between items-center">
                      <div>
                          <div className="text-[8px] text-cyan-500 font-mono uppercase mb-0.5 flex items-center gap-1"><Wind size={8}/> Velocity</div>
                          <div className="text-sm font-mono font-bold text-white">{liveData.v.toFixed(2)} <span className="text-[8px] text-slate-500">m/s</span></div>
                      </div>
                      <div className="w-px h-6 bg-white/10"></div>
                      <div>
                          <div className="text-[8px] text-orange-500 font-mono uppercase mb-0.5 flex items-center gap-1"><Gauge size={8}/> Accel</div>
                          <div className="text-sm font-mono font-bold text-white">{liveData.a.toFixed(1)} <span className="text-[8px] text-slate-500">m/s²</span></div>
                      </div>
                 </div>

                 {/* Phase Bio-Metrics (Visible primarily in slow mo, or always if space permits) */}
                 <div className={`bg-black/80 backdrop-blur-md border rounded-xl p-3 flex flex-col justify-center transition-opacity duration-300 ${results ? 'border-emerald-500/30' : 'border-red-500/30'} ${replaySpeed < 0.5 ? 'opacity-100' : 'opacity-80'}`}>
                      <div className={`text-[8px] font-mono uppercase mb-0.5 flex items-center gap-1 ${results ? 'text-emerald-400' : 'text-red-400'}`}>
                          {results ? <Activity size={8} /> : <AlertTriangle size={8} />} {getBioPhaseText()}
                      </div>
                      <div className="text-[9px] text-slate-300 leading-tight">
                          {getBioPhaseDesc()}
                      </div>
                 </div>

            </div>

          </div>
      </div>
    </>
  );
};

export default ReplayOverlay;