import React from 'react';
import { X, ShieldCheck, AlertTriangle, Info, Terminal } from 'lucide-react';

interface InfoSectionProps {
  onClose: () => void;
}

const InfoSection: React.FC<InfoSectionProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-xl p-6 flex flex-col overflow-y-auto animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-blue-500 flex items-center gap-2">
            <Terminal size={24} /> System_Info
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
        </button>
      </div>

      <div className="space-y-8 max-w-2xl mx-auto w-full">
          
          {/* Rules */}
          <section className="space-y-4">
              <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2">Operational Parameters</h3>
              <div className="grid gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border-l-4 border-blue-500">
                      <h4 className="font-bold text-white mb-1">1. The Protocol</h4>
                      <p className="text-sm text-slate-400">Hold your finger on the <span className="text-blue-400">blue start point (A)</span>. Wait for the hidden timer. When the <span className="text-red-500">red target (B)</span> appears, strike it as fast as possible.</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border-l-4 border-purple-500">
                      <h4 className="font-bold text-white mb-1">2. Biometrics</h4>
                      <p className="text-sm text-slate-400">We analyze your "Reaction Time" (brain to finger) vs "Travel Time" (pure speed). The AI looks for patterns in your acceleration to determine muscle fiber composition.</p>
                  </div>
              </div>
          </section>

          {/* Fair Play */}
          <section className="space-y-4">
              <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
                  <ShieldCheck size={14} /> Fair Play Integrity
              </h3>
              <div className="grid gap-3">
                   <div className="flex items-start gap-3 text-sm text-slate-300">
                       <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                       <p><strong>Boundary Breach:</strong> Leaving the screen area during a test voids the result immediately.</p>
                   </div>
                   <div className="flex items-start gap-3 text-sm text-slate-300">
                       <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                       <p><strong>Precision Miss:</strong> You must physically touch/enter the target circle. Near misses are counted as failures to test dexterity under pressure.</p>
                   </div>
                   <div className="flex items-start gap-3 text-sm text-slate-300">
                       <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                       <p><strong>Early Release:</strong> Lifting your finger before the target appears is a false start.</p>
                   </div>
              </div>
          </section>

          {/* Credits */}
          <div className="mt-12 pt-12 border-t border-white/10 text-center space-y-2">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-full border border-white/5">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">
                    Produced by <span className="text-white font-bold">Gemini</span>
                </p>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em] mt-1">
                    Directed by <span className="text-white font-bold">"Devansh"</span>
                </p>
              </div>
              <p className="text-[9px] text-slate-600 font-mono mt-4">v2.4.0-STRIKELAB-RC</p>
          </div>

      </div>
    </div>
  );
};

export default InfoSection;