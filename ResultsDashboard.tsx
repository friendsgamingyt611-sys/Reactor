import React from 'react';
import { Play, Activity, Brain, Zap, Loader2, RotateCcw, Target, TrendingUp, Map, Wind, Gauge, Trophy } from 'lucide-react';

interface ResultsDashboardProps {
  results: any;
  analysis: any;
  isAnalyzing: boolean;
  deviceInfo: any;
  systemOverhead: number;
  onReplay: (speed: number) => void;
  onReset: () => void;
  onShowAnalysis: () => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  analysis,
  isAnalyzing,
  deviceInfo,
  systemOverhead,
  onReplay,
  onReset,
  onShowAnalysis
}) => {
  
  // Benchmarking Logic
  const getBenchmarks = () => {
      const list = [
          { label: "House Fly", val: 20, icon: "🪰", color: "text-purple-500" },
          { label: "Pro Gamer", val: 160, icon: "🎮", color: "text-blue-500" },
          { label: "F1 Driver", val: 200, icon: "🏎️", color: "text-red-500" },
          { label: "Avg Human", val: 250, icon: "😐", color: "text-slate-500" },
          { label: "Fatigued", val: 400, icon: "😫", color: "text-amber-700" },
          { label: "YOU", val: Math.round(results.reactionTime), icon: "👤", color: "text-white font-bold bg-white/10 rounded", isUser: true }
      ];
      
      // Sort by time (faster is higher/better for the list visual usually, but here we list by ms ascending)
      const sorted = list.sort((a, b) => a.val - b.val);
      
      // Find user index to potentially scroll or highlight
      return sorted;
  };

  const benchmarks = getBenchmarks();

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl p-6 flex flex-col transition-opacity duration-500 z-50 overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">TWITCH_RESULT</h2>
          <div className="mt-2 inline-flex items-center gap-2">
             <div className="px-2 py-0.5 bg-red-600 text-[10px] font-black uppercase skew-x-[-12deg] text-white">{results.tier}</div>
             <div className="text-[9px] font-mono text-slate-500">SCORE: {Math.round(100000 / (results.reactionTime * results.travelTime))} pts</div>
          </div>
        </div>
        <div className="text-right font-mono text-[9px] text-slate-500">
          <p>HARDWARE: {deviceInfo.cores} CORES</p>
          <p>LATENCY_COMP: {systemOverhead.toFixed(2)}ms</p>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Row 1: Time */}
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
          <p className="text-[9px] text-slate-500 uppercase font-black">Reaction Time</p>
          <p className="text-2xl font-mono font-bold text-yellow-500 leading-none mt-1">{Math.round(results.reactionTime)}<span className="text-xs ml-1 text-slate-500">ms</span></p>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
           <p className="text-[9px] text-slate-500 uppercase font-black">Movement Time</p>
           <p className="text-2xl font-mono font-bold text-emerald-500 leading-none mt-1">{Math.round(results.travelTime)}<span className="text-xs ml-1 text-slate-500">ms</span></p>
        </div>

        {/* Row 2: Kinematics */}
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <p className="text-[9px] text-slate-500 uppercase font-black flex items-center gap-1"><Wind size={10} /> Max Velocity</p>
            <p className="text-xl font-mono font-bold text-cyan-400 leading-none mt-1">{results.peakV.toFixed(2)}<span className="text-xs ml-1 text-slate-500">m/s</span></p>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <p className="text-[9px] text-slate-500 uppercase font-black flex items-center gap-1"><Gauge size={10} /> Max Accel</p>
            <p className="text-xl font-mono font-bold text-orange-400 leading-none mt-1">{results.peakA.toFixed(1)}<span className="text-xs ml-1 text-slate-500">m/s²</span></p>
        </div>

        {/* Row 3: Precision */}
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
          <div>
              <p className="text-[9px] text-slate-500 uppercase font-black flex items-center gap-1"><Target size={10} /> Accuracy</p>
              <p className="text-lg font-mono font-bold text-blue-400 leading-none mt-1">{results.accuracy.toFixed(1)}<span className="text-xs ml-1 text-slate-500">mm</span></p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
          <div>
               <p className="text-[9px] text-slate-500 uppercase font-black flex items-center gap-1"><TrendingUp size={10} /> Efficiency</p>
               <p className="text-lg font-mono font-bold text-purple-400 leading-none mt-1">{results.pathEfficiency.toFixed(1)}<span className="text-xs ml-1 text-slate-500">%</span></p>
          </div>
        </div>
      </div>

      {/* Benchmarking Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Trophy size={10} /> Global Hierarchy</h3>
          <div className="space-y-2">
              {benchmarks.map((item, idx) => {
                  const maxVal = 500;
                  const widthPct = Math.min(100, (item.val / maxVal) * 100);
                  
                  return (
                    <div key={idx} className={`flex items-center gap-3 text-xs font-mono ${item.color} ${item.isUser ? 'py-1' : 'opacity-60'}`}>
                        <span className="w-5 text-center">{item.icon}</span>
                        <div className="flex-grow">
                            <div className="flex justify-between mb-0.5">
                                <span>{item.label}</span>
                                <span>{item.val}ms</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full ${item.isUser ? 'bg-white' : 'bg-current'}`} style={{ width: `${widthPct}%` }}></div>
                            </div>
                        </div>
                    </div>
                  );
              })}
          </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-gradient-to-br from-slate-900 to-black border border-white/10 p-5 rounded-2xl mb-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-20">
              <Brain size={48} />
          </div>
          
          <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              {isAnalyzing ? <Loader2 className="animate-spin" size={10}/> : <Zap size={10}/>}
              Deep-Tissue Analysis
          </h3>

          {isAnalyzing ? (
              <div className="space-y-2 animate-pulse">
                  <div className="h-2 bg-white/10 rounded w-3/4"></div>
                  <div className="h-2 bg-white/10 rounded w-1/2"></div>
                  <div className="h-2 bg-white/10 rounded w-5/6"></div>
              </div>
          ) : analysis ? (
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-mono">
                   <p><span className="text-slate-500 font-bold uppercase mr-2">Signal:</span> {analysis.synapticDelay}</p>
                   <p><span className="text-slate-500 font-bold uppercase mr-2">Fiber:</span> {analysis.muscleFiberType}</p>
                   <div className="mt-3 pt-3 border-t border-white/10">
                       <p className="text-blue-200 italic">"{analysis.summary}"</p>
                   </div>
              </div>
          ) : (
              <p className="text-xs text-slate-500">Waiting for bio-metrics...</p>
          )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
              onClick={() => onReplay(1.0)}
              className="bg-white/10 hover:bg-white/20 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
          >
              <Play size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Replay</span>
          </button>
          <button 
              onClick={() => onReplay(0.1)}
              className="bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
          >
              <Activity size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Slow-Mo</span>
          </button>
          <button 
              onClick={onShowAnalysis}
              className="col-span-2 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-500/30 p-3 rounded-xl flex items-center justify-center gap-2 transition-all group"
          >
              <Map size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">View Path Deviation Analysis</span>
          </button>
      </div>

      <button 
        onClick={onReset}
        className="mt-auto py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl active:bg-blue-600 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
      >
        <RotateCcw size={16} /> Recalibrate Sensors
      </button>
    </div>
  );
};

export default ResultsDashboard;