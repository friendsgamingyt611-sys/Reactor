import React, { useMemo } from 'react';
import { X, Trash2, Trophy, Calendar, Clock, History, TrendingUp } from 'lucide-react';

interface HistoryItem {
  id: number;
  date: string;
  reactionTime: number;
  tier: string;
}

interface HistorySectionProps {
  history: HistoryItem[];
  onClose: () => void;
  onClear: () => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({ history, onClose, onClear }) => {
  
  const stats = useMemo(() => {
    const now = new Date();
    
    const isSameDay = (d1: Date, d2: Date) => 
      d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
      
    const isSameWeek = (d1: Date, d2: Date) => {
      const oneDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.round(Math.abs((d1.getTime() - d2.getTime()) / oneDay));
      return diffDays < 7;
    };

    const isSameMonth = (d1: Date, d2: Date) => 
      d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

    const isSameYear = (d1: Date, d2: Date) => 
      d1.getFullYear() === d2.getFullYear();

    const getBest = (items: HistoryItem[]) => {
      if (items.length === 0) return null;
      return items.reduce((prev, curr) => prev.reactionTime < curr.reactionTime ? prev : curr);
    };

    const parsedHistory = history.map(h => ({ ...h, dateObj: new Date(h.date) }));

    return {
      day: getBest(parsedHistory.filter(h => isSameDay(h.dateObj, now))),
      week: getBest(parsedHistory.filter(h => isSameWeek(h.dateObj, now))),
      month: getBest(parsedHistory.filter(h => isSameMonth(h.dateObj, now))),
      year: getBest(parsedHistory.filter(h => isSameYear(h.dateObj, now))),
      allTime: getBest(parsedHistory)
    };
  }, [history]);

  const StatCard = ({ label, item, icon }: { label: string, item: HistoryItem | null, icon: any }) => (
    <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden group hover:bg-white/10 transition-colors">
      <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity">
        {icon}
      </div>
      <span className="text-[9px] font-mono uppercase text-slate-500 tracking-widest mb-1">{label}</span>
      {item ? (
        <>
          <span className="text-2xl font-black text-white italic">{Math.round(item.reactionTime)}<span className="text-xs text-slate-500 not-italic ml-0.5">ms</span></span>
          <span className="text-[9px] text-slate-400 mt-1">{new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <span className="text-[8px] text-blue-500 font-bold mt-1 px-1.5 py-0.5 bg-blue-500/10 rounded">{item.tier}</span>
        </>
      ) : (
        <span className="text-sm text-slate-600 font-mono py-2">--</span>
      )}
    </div>
  );

  return (
    <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-xl p-6 flex flex-col overflow-hidden animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-blue-500 flex items-center gap-2">
            <History size={24} /> Strike_Log
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
        </button>
      </div>

      <div className="overflow-y-auto pr-2 pb-20">
        
        {/* Bests Grid */}
        <div className="mb-8">
            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                <Trophy size={14} className="text-yellow-500" />
                PERSONAL RECORDS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="Today" item={stats.day} icon={<Clock size={16}/>} />
                <StatCard label="This Week" item={stats.week} icon={<Calendar size={16}/>} />
                <StatCard label="This Month" item={stats.month} icon={<Calendar size={16}/>} />
                <StatCard label="This Year" item={stats.year} icon={<Calendar size={16}/>} />
                <StatCard label="All Time" item={stats.allTime} icon={<Trophy size={16}/>} />
            </div>
        </div>

        {/* Recent List */}
        <div>
            <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-500" />
                    RECENT ACTIVITY
                </h3>
                <span className="text-[9px] text-slate-500 font-mono">{history.length} ENTRIES</span>
            </div>
            
            <div className="space-y-2">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-slate-600 font-mono text-xs">NO DATA RECORDED</div>
                ) : (
                    [...history].reverse().map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(item.date).toLocaleDateString()} &bull; {new Date(item.date).toLocaleTimeString()}
                                </span>
                                <span className="text-xs font-bold text-white">{item.tier}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-mono font-bold text-blue-400">{Math.round(item.reactionTime)}<span className="text-xs text-slate-500 ml-0.5">ms</span></span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent pointer-events-none flex justify-center">
         <button 
            onClick={onClear}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 rounded-full text-red-400 text-[10px] font-bold uppercase tracking-widest transition-colors"
         >
             <Trash2 size={12} /> Clear All Data
         </button>
      </div>

    </div>
  );
};

export default HistorySection;