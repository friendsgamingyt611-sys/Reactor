import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Zap, Activity, SkipForward, Play } from 'lucide-react';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: <Zap size={48} className="text-yellow-400" />,
    title: "Welcome to StrikeLab",
    desc: "A professional-grade tool to measure your neurological reaction speed and motor efficiency."
  },
  {
    icon: <Play size={48} className="text-blue-400" />,
    title: "How to Measure",
    desc: "1. Hold the BLUE circle.\n2. Wait for the signal.\n3. Swipe to the RED target instantly."
  },
  {
    icon: <Activity size={48} className="text-purple-400" />,
    title: "Understanding Data",
    desc: "We split your speed into 'Reaction' (mental) and 'Movement' (physical). Use the 'Slow-Mo' replay to analyze your path efficiency."
  },
  {
    icon: <CheckCircle size={48} className="text-emerald-400" />,
    title: "Fair Play Rules",
    desc: "Accuracy matters. If you miss the target or run off-screen, the test is voided. Precision is as important as speed."
  }
];

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [idx, setIdx] = useState(0);

  const handleNext = () => {
    if (idx < slides.length - 1) {
      setIdx(idx + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="absolute inset-0 z-[70] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-300" style={{ width: `${((idx + 1) / slides.length) * 100}%` }}></div>

        <div className="flex flex-col items-center text-center space-y-6 min-h-[300px] justify-center">
            <div className="bg-white/5 p-6 rounded-full ring-1 ring-white/10 animate-bounce-slow">
                {slides[idx].icon}
            </div>
            
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 key={idx}">
                <h2 className="text-2xl font-black italic uppercase text-white">{slides[idx].title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                    {slides[idx].desc}
                </p>
            </div>
        </div>

        <div className="mt-8 flex gap-3">
            <button 
                onClick={onComplete}
                className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 text-xs font-bold uppercase hover:bg-white/10 transition-colors"
            >
                Skip
            </button>
            <button 
                onClick={handleNext}
                className="flex-[2] py-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
                {idx === slides.length - 1 ? "Start Testing" : "Next"} <ArrowRight size={14} />
            </button>
        </div>

      </div>
    </div>
  );
};

export default TutorialOverlay;