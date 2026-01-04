import React from 'react';
import { Activity, Clock, Play, Pause, Square, Rewind, FastForward } from 'lucide-react';

interface ReplayOverlayProps {
  replayTime: number;
  duration: number;
  results: any;
  replaySpeed: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onStop: () => void;
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
  onStop
}) => {
  const getBioPhaseText = () => {
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
    const reactionMs = results.reactionTime;
    const t = replayTime;
    
    if (t < 20) return "Retina converts photons to electrical signals. Latency: <20ms.";
    if (t < 80) return "Signal travels via optic nerve to LGN and Visual Cortex.";
    if (t < reactionMs) return "Pre-motor cortex calculates trajectory. Muscle fibers primed.";
    if (t < reactionMs + 30) return "Acetylcholine released. Fast-twitch fibers recruited.";
    return "Peak velocity achieved. Cerebellum fine-tunes path accuracy.";
  };

  return (
    <>
      {/* Player Controls */}
      <div className="absolute bottom-12 left-4 right-4 z-50 flex flex-col items-center">
          
          {/* Bio-Metrics Floating Panel (Only if slow speed) */}
          {replaySpeed < 0.5 && (
             <div className="mb-4 bg-black/80 backdrop-blur-xl border-l-2 border-emerald-500 p-4 rounded-r-xl max-w-md w-full animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
                 <div className="flex justify-between items-start">
                     <div>
                        <div className="text-[10px] text-emerald-400 font-mono mb-1 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={10} /> Neuro-Kinetics
                        </div>
                        <h4 className="text-lg font-bold text-white leading-tight">{getBioPhaseText()}</h4>
                     </div>
                     <div className="text-right">
                         <span className="text-2xl font-mono font-bold text-slate-500">{Math.floor(replayTime)}<span className="text-xs">ms</span></span>
                     </div>
                 </div>
                 <p className="text-xs text-slate-300 mt-2 leading-relaxed font-mono border-t border-white/10 pt-2">
                     {getBioPhaseDesc()}
                 </p>
            </div>
          )}

          {/* Timeline & Controls */}
          <div className="bg-[#111]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-full max-w-lg shadow-2xl">
              
              {/* Timeline Slider */}
              <div className="relative h-6 mb-2 flex items-center">
                   <input 
                      type="range" 
                      min="0" 
                      max={duration} 
                      value={replayTime}
                      onChange={(e) => onSeek(Number(e.target.value))}
                      className="absolute w-full h-full opacity-0 z-20 cursor-pointer"
                   />
                   
                   {/* Custom Track */}
                   <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
                       {/* Color coded phases */}
                       <div 
                          className="absolute h-full bg-yellow-500/30" 
                          style={{ width: `${(results.reactionTime / duration) * 100}%` }} 
                       />
                       <div 
                          className="absolute h-full bg-emerald-500/30" 
                          style={{ left: `${(results.reactionTime / duration) * 100}%`, right: 0 }} 
                       />
                       
                       {/* Progress Fill */}
                       <div 
                           className="h-full bg-blue-500 relative transition-all duration-75 ease-linear"
                           style={{ width: `${(replayTime / duration) * 100}%` }}
                       />
                   </div>
                   
                   {/* Thumb Indicator */}
                   <div 
                       className="absolute h-4 w-4 bg-white rounded-full shadow-lg pointer-events-none transition-all duration-75 ease-linear border-2 border-blue-500"
                       style={{ left: `calc(${(replayTime / duration) * 100}% - 8px)` }}
                   />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onSpeedChange(0.1)} 
                        className={`text-[9px] font-mono px-2 py-1 rounded border ${replaySpeed === 0.1 ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20 text-slate-400'}`}
                      >0.1x</button>
                      <button 
                        onClick={() => onSpeedChange(1.0)} 
                        className={`text-[9px] font-mono px-2 py-1 rounded border ${replaySpeed === 1.0 ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20 text-slate-400'}`}
                      >1.0x</button>
                  </div>

                  <div className="flex items-center gap-4">
                      <button onClick={onTogglePlay} className="text-white hover:text-blue-400 transition-colors">
                          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                      </button>
                      <button onClick={onStop} className="text-slate-400 hover:text-red-400 transition-colors">
                          <Square size={20} fill="currentColor" />
                      </button>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 w-20 text-right">
                      {Math.floor(replayTime)} / {Math.floor(duration)}ms
                  </div>
              </div>
          </div>
      </div>
    </>
  );
};

export default ReplayOverlay;