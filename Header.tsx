import React from 'react';

interface HeaderProps {
  systemOverhead: number;
  deviceInfo: { model: string; cores: number | string; agent: string };
}

const Header: React.FC<HeaderProps> = ({ systemOverhead, deviceInfo }) => {
  return (
    <div className="p-6 border-b border-white/10 flex justify-between items-end relative z-10 bg-[#050505]/80 backdrop-blur-sm">
      <div>
        <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">
          STRIKE<span className="text-red-600">LAB</span> <span className="text-[10px] not-italic text-emerald-500 ml-2">BIO-METRIC</span>
        </h1>
        <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest">Compensating: -{systemOverhead.toFixed(2)}ms Hardware Delay</p>
      </div>
      <div className="text-right hidden sm:block">
         <p className="text-[8px] font-mono text-slate-500 uppercase">{deviceInfo.model}</p>
         <p className="text-[8px] font-mono text-slate-600">{deviceInfo.agent}</p>
      </div>
    </div>
  );
};

export default Header;