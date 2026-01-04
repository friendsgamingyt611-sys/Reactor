import React from 'react';
import { Activity, Clock } from 'lucide-react';

interface ReplayOverlayProps {
  replayTime: number;
  results: any;
  replayProgress: number;
  replaySpeed: number;
  onStop: () => void;
}

const ReplayOverlay: React.FC<ReplayOverlayProps> = ({
  replayTime,
  results,
  replayProgress,
  replaySpeed,
  onStop
}) => {
  const getBioPhaseText = () => {
      const reactionMs = results.reactionTime;
      const t = replayTime;
      
      if (t < 20) return "Phase 0: Photoreception (Retina)";
      if (t < 80) return "Phase 1: Signal Transit (Optic Nerve → Thalamus)";
      if (t < Math.min(140, reactionMs)) return "Phase 2: Processing (Visual Cortex)";
      if (t < reactionMs) return "Phase 3: Motor Planning (Pre-Motor Cortex)";
      if (t >= reactionMs && t < reactionMs + 50) return "Phase 4: Neuromuscular Junction Firing";
      return "Phase 5: Muscular Contraction & Ballistic Motion";
  };

  const getBioPhaseDesc = () => {
    const reactionMs = results.reactionTime;
    const t = replayTime;
    return t < reactionMs 
       ? "Brain is calculating trajectory. Signal is traveling from visual cortex to motor cortex. No movement detected yet."
       : "Spinal motor neurons have fired. Muscles are contracting. Limb is in ballistic transit to target coordinates.";
  };

  return (
    <>
      <div className="absolute bottom-20 left-6 right-6 z-50">
          <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2 font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                  <span>Stimulus (0ms)</span>
                  <span className="text-white font-bold text-lg"><Clock size={12} className="inline mr-1"/>{Math.floor(replayTime)}ms</span>
                  <span>Impact ({Math.floor(results.reactionTime + results.travelTime)}ms)</span>
              </div>
              
              <div className="relative h-4 bg-white/5 rounded-full overflow-hidden w-full flex">
                   <div 
                      style={{ width: `${(results.reactionTime / (results.reactionTime + results.travelTime)) * 100}%` }}
                      className="h-full bg-yellow-500/30 border-r border-white/20 relative"
                   >
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-yellow-500">REACTION</span>
                   </div>
                   <div className="flex-1 h-full bg-emerald-500/30 relative">
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-emerald-500">TRAVEL</span>
                   </div>
                   <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,1)] z-10 transition-all duration-75 ease-linear"
                      style={{ left: `${replayProgress * 100}%` }}
                   />
              </div>
          </div>
      </div>

      {replaySpeed < 0.5 && (
          <div className="absolute top-6 left-6 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md border-l-2 border-emerald-500 p-4 max-w-sm animate-in fade-in slide-in-from-left-4">
                   <div className="text-[10px] text-emerald-400 font-mono mb-1 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={10} /> Live Bio-Telemetry
                   </div>
                   <div className="mt-2">
                       <h4 className="text-xl font-bold text-white leading-none">{getBioPhaseText()}</h4>
                       <p className="text-xs text-slate-300 mt-2 leading-relaxed font-mono border-t border-white/10 pt-2">
                           {getBioPhaseDesc()}
                       </p>
                   </div>
              </div>
          </div>
      )}

      <div className="absolute bottom-10 w-full text-center z-50">
        <button onClick={onStop} className="bg-black/80 backdrop-blur border border-white/20 text-white px-6 py-2 rounded-full text-xs font-mono uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Stop Replay
        </button>
      </div>
    </>
  );
};

export default ReplayOverlay;