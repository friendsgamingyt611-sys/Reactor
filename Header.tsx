import React from 'react';
import { HelpCircle, History } from 'lucide-react';

interface HeaderProps {
  systemOverhead: number;
  deviceInfo: { model: string; cores: number | string; agent: string };
  onOpenInfo: () => void;
  onOpenHistory: () => void;
}

const Header: React.FC<HeaderProps> = ({ systemOverhead, deviceInfo, onOpenInfo, onOpenHistory }) => {
  return (
    <div className="p-6 border-b border-white/10 flex justify-between items-center relative z-10 bg-[#050505]/80 backdrop-blur-sm">
      <div>
        <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">
          STRIKE<span className="text-red-600">LAB</span> <span className="text-[10px] not-italic text-emerald-500 ml-2">BIO-METRIC</span>
        </h1>
        <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest">Compensating: -{systemOverhead.toFixed(2)}ms Hardware Delay</p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block mr-2">
           <p className="text-[8px] font-mono text-slate-500 uppercase">{deviceInfo.model}</p>
           <p className="text-[8px] font-mono text-slate-600">{deviceInfo.agent}</p>
        </div>
        
        <button 
          onClick={onOpenHistory}
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-blue-400 transition-colors"
          title="Strike History"
        >
           <History size={16} />
        </button>

        <button 
          onClick={onOpenInfo}
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Information"
        >
           <HelpCircle size={16} />
        </button>
      </div>
    </div>
  );
};

export default Header;