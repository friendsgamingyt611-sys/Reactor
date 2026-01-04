import React, { useState } from 'react';
import { Play, Activity, Brain, Zap, Loader2, RotateCcw, Target, TrendingUp, Map, Wind, Gauge, Trophy, Timer } from 'lucide-react';

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
  const [rankTab, setRankTab] = useState<'reaction' | 'motor' | 'overall'>('reaction');

  // Comparison Data Logic
  const getComparisons = () => {
    // 1. Reaction Time (Lower is better)
    const reactionList = [
        { label: "House Fly", val: 20, icon: "🪰", color: "text-purple-500", unit: "ms" },
        { label: "Pro Gamer", val: 150, icon: "🎮", color: "text-blue-500", unit: "ms" },
        { label: "F1 Driver", val: 200, icon: "🏎️", color: "text-red-500", unit: "ms" },
        { label: "Avg Human", val: 250, icon: "😐", color: "text-slate-500", unit: "ms" },
        { label: "Fatigued", val: 450, icon: "😫", color: "text-amber-700", unit: "ms" },
        { label: "YOU", val: Math.round(results.reactionTime), icon: "👤", color: "text-white font-bold bg-white/10 rounded", isUser: true, unit: "ms" }
    ].sort((a, b) => a.val - b.val);

    // 2. Motor Execution (Peak Velocity - Higher is better)
    const motorList = [
        { label: "Mantis Shrimp", val: 23.0, icon: "🦐", color: "text-pink-500", unit: "m/s" },
        { label: "Pro Boxer", val: 11.0, icon: "🥊", color: "text-orange-500", unit: "m/s" },
        { label: "Cobra", val: 5.5, icon: "🐍", color: "text-green-500", unit: "m/s" },
        { label: "Avg Human", val: 3.5, icon: "😐", color: "text-slate-500", unit: "m/s" },
        { label: "Sloth", val: 0.1, icon: "🦥", color: "text-amber-700", unit: "m/s" },
        { label: "YOU", val: Number(results.peakV.toFixed(1)), icon: "👤", color: "text-white font-bold bg-white/10 rounded", isUser: true, unit: "m/s" }
    ].sort((a, b) => b.val - a.val);

    // 3. Overall Score
    // Formula: Mixed weighted score.
    // Time Score: Based on 1000ms base. 
    // Accuracy Score: Direct 0-100.
    const totalTime = results.reactionTime + results.travelTime;
    const timeScore = Math.min(100, Math.round((1000 / totalTime) * 30));
    const accuracyScore = results.accuracyScore || 0;
    
    // Weight: 70% Time, 30% Accuracy
    const scoreVal = Math.round((timeScore * 0.7) + (accuracyScore * 0.3));

    const overallList = [
        { label: "Cybernetic", val: 99, icon: "🤖", color: "text-cyan-400", unit: "pts" },
        { label: "Olympian", val: 85, icon: "🥇", color: "text-yellow-400", unit: "pts" },
        { label: "Varsity", val: 65, icon: "🏃", color: "text-blue-400", unit: "pts" },
        { label: "Standard", val: 45, icon: "😐", color: "text-slate-500", unit: "pts" },
        { label: "Sedentary", val: 20, icon: "🛋️", color: "text-slate-700", unit: "pts" },
        { label: "YOU", val: scoreVal, icon: "👤", color: "text-white font-bold bg-white/10 rounded", isUser: true, unit: "pts" }
    ].sort((a, b) => b.val - a.val);

    return { reactionList, motorList, overallList, scoreVal };
  };

  const { reactionList, motorList, overallList, scoreVal } = getComparisons();

  const getActiveList = () => {
      switch(rankTab) {
          case 'reaction': return { list: reactionList, max: 500, label: "Reaction Speed", inverse: true }; // inverse: lower is better visually
          case 'motor': return { list: motorList, max: 25, label: "Motor Velocity", inverse: false };
          case 'overall': return { list: overallList, max: 100, label: "Composite Score", inverse: false };
      }
  };

  const activeData = getActiveList();

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl p-6 flex flex-col transition-opacity duration-500 z-50 overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">TWITCH_RESULT</h2>
          <div className="mt-2 inline-flex items-center gap-2">
             <div className="px-2 py-0.5 bg-red-600 text-[10px] font-black uppercase skew-x-[-12deg] text-white">{results.tier}</div>
             <div className="text-[9px] font-mono text-slate-500">SCORE: {scoreVal}/100</div>
          </div>
        </div>
        <div className="text-right font-mono text-[9px] text-slate-500">
          <p>HARDWARE: {deviceInfo.cores} CORES</p>
          <p>LATENCY_COMP: {systemOverhead.toFixed(2)}ms</p>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Row 1: Time */}
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
          <p className="text-[9px] text-slate-500 uppercase font-black">Reaction Time</p>
          <p className="text-2xl font-mono font-bold text-yellow-500 leading-none mt-1">{Math.round(results.reactionTime)}<span className="text-xs ml-1 text-slate-500">ms</span></p>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
           <p className="text-[9px] text-slate-500 uppercase font-black">Movement Time</p>
           <p className="text-2xl font-mono font-bold text-emerald-500 leading-none mt-1">{Math.round(results.travelTime)}<span className="text-xs ml-1 text-slate-500">ms</span></p>
        </div>

        {/* Row 2: Kinematics & Accuracy */}
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <p className="text-[9px] text-slate-500 uppercase font-black flex items-center gap-1"><Wind size={10} /> Max Velocity</p>
            <p className="text-xl font-mono font-bold text-cyan-400 leading-none mt-1">{results.peakV.toFixed(2)}<span className="text-xs ml-1 text-slate-500">m/s</span></p>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <p className="text-[9px] text-slate-500 uppercase font-black flex items-center gap-1"><Target size={10} /> Precision Score</p>
            <div className="flex items-baseline gap-2">
                <p className="text-xl font-mono font-bold text-purple-400 leading-none mt-1">{Math.round(results.accuracyScore)}<span className="text-xs ml-1 text-slate-500">/100</span></p>
                <p className="text-[9px] text-slate-500">({results.accuracy.toFixed(1)}mm dev)</p>
            </div>
        </div>
      </div>

      {/* 3-Tab Benchmark Hierarchy */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Trophy size={10} /> Global Hierarchy</h3>
             
             {/* Tab Switcher */}
             <div className="flex bg-black rounded-lg p-1 gap-1">
                 <button 
                   onClick={() => setRankTab('reaction')} 
                   className={`p-1.5 rounded transition-colors ${rankTab === 'reaction' ? 'bg-white/20 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                 >
                    <Timer size={12} />
                 </button>
                 <button 
                   onClick={() => setRankTab('motor')} 
                   className={`p-1.5 rounded transition-colors ${rankTab === 'motor' ? 'bg-white/20 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                 >
                    <Zap size={12} />
                 </button>
                 <button 
                   onClick={() => setRankTab('overall')} 
                   className={`p-1.5 rounded transition-colors ${rankTab === 'overall' ? 'bg-white/20 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                 >
                    <Activity size={12} />
                 </button>
             </div>
          </div>

          <div className="mb-2 text-[10px] font-black text-center uppercase tracking-[0.2em] text-blue-500">
               {activeData.label}
          </div>

          <div className="space-y-2">
              {activeData.list.map((item, idx) => {
                  let widthPct = 0;
                  if (rankTab === 'reaction') {
                      // For reaction, smaller is better. Invert visualization.
                      // Max displayed is 500ms. If 20ms, width 100%. If 500ms, width 0%.
                      widthPct = Math.max(5, 100 - (item.val / activeData.max) * 100);
                  } else {
                      // For others, higher is better.
                      widthPct = Math.min(100, (item.val / activeData.max) * 100);
                  }
                  
                  return (
                    <div key={idx} className={`flex items-center gap-3 text-xs font-mono ${item.color} ${item.isUser ? 'py-1' : 'opacity-60'}`}>
                        <span className="w-5 text-center text-lg">{item.icon}</span>
                        <div className="flex-grow">
                            <div className="flex justify-between mb-0.5">
                                <span>{item.label}</span>
                                <span>{item.val}{item.unit}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out ${item.isUser ? 'bg-white' : 'bg-current'}`} 
                                    style={{ width: `${widthPct}%` }}
                                ></div>
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