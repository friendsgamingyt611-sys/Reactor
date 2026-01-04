import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AlertTriangle, RotateCcw, PlayCircle } from 'lucide-react';
import Header from './Header';
import PlayArea from './PlayArea';
import ResultsDashboard from './ResultsDashboard';
import ReplayOverlay from './ReplayOverlay';
import PathAnalysis from './PathAnalysis';
import InfoSection from './InfoSection';
import TutorialOverlay from './TutorialOverlay';
import HistorySection from './HistorySection';

// --- Types ---
interface Point {
  t: number;
  x: number;
  y: number;
  v: number;
  a: number;
}

interface Results {
  reactionTime: number;
  travelTime: number;
  peakV: number;
  peakA: number;
  tier: string;
  accuracy: number; // in mm
  pathEfficiency: number; // percentage
}

interface BiometricAnalysis {
  synapticDelay: string;
  motorRecruitment: string;
  muscleFiberType: string;
  summary: string;
}

interface HistoryItem {
  id: number;
  date: string;
  reactionTime: number;
  tier: string;
}

// --- App Component ---
const App = () => {
  const [gameState, setGameState] = useState<'idle' | 'holding' | 'active' | 'results' | 'replay' | 'analysis' | 'failed'>('idle'); 
  const [failReason, setFailReason] = useState<string>('');
  
  const [points, setPoints] = useState({ a: { x: 0, y: 0 }, b: { x: 0, y: 0 } });
  const [results, setResults] = useState<Results | null>(null);
  const [isHoldingA, setIsHoldingA] = useState(false);
  
  // Advanced Calibration States
  const [systemOverhead, setSystemOverhead] = useState(0); // ms
  const [deviceInfo, setDeviceInfo] = useState({ model: "Unknown", cores: 0, agent: "Unknown" });

  // Replay & Analysis States
  const [analysis, setAnalysis] = useState<BiometricAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Failure Replay Data
  const [violationPoint, setViolationPoint] = useState<{x: number, y: number} | null>(null);
  
  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1.0);
  const [replayTime, setReplayTime] = useState(0); // ms relative to goTime
  const [replayDuration, setReplayDuration] = useState(0);

  // New UI States
  const [showInfo, setShowInfo] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const path = useRef<Point[]>([]); 
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeoutRef = useRef<any>(null); 
  const goTimeRef = useRef(0);
  const replayFrameRef = useRef<number>(0);
  const lastReplayTimeRef = useRef<number | null>(null);

  // 1. Initial Setup & Calibration & History Load
  useEffect(() => {
    // Check for first time visitor
    const hasSeenTutorial = localStorage.getItem('strikeLab_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }

    // Load History
    const savedHistory = localStorage.getItem('strikeLab_history');
    if (savedHistory) {
        try {
            setHistory(JSON.parse(savedHistory));
        } catch (e) {
            console.error("Corrupt history data");
        }
    }

    const runCalibration = () => {
      const samples = [];
      for (let i = 0; i < 50; i++) {
        const t0 = performance.now();
        Array.from({length: 100}, (_, i) => Math.sqrt(i));
        const t1 = performance.now();
        samples.push(t1 - t0);
      }
      const avgOverhead = samples.reduce((a, b) => a + b, 0) / samples.length;
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const platformLag = isMobile ? 8.0 : 4.0; 
      
      setSystemOverhead(avgOverhead + platformLag);
      setDeviceInfo({
        model: isMobile ? "Mobile Sensor Array" : "Desktop Precision Input",
        cores: navigator.hardwareConcurrency || 0,
        agent: navigator.userAgent.split('(')[1]?.split(')')[0] || "Unknown Hardware"
      });
    };

    runCalibration();
  }, []);

  const finishTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('strikeLab_tutorial_seen', 'true');
  };

  const clearHistory = () => {
      setHistory([]);
      localStorage.removeItem('strikeLab_history');
  };

  const getPPM = () => {
    const basePPI = 160; 
    const inchesToMeters = 0.0254;
    return (basePPI * (window.devicePixelRatio || 1)) / inchesToMeters;
  };

  const generatePoints = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const ppm = getPPM();
    
    // Increased top padding to avoid UI overlap with Header/Replay Controls
    const paddingX = 40;
    const paddingBottom = 100;
    const paddingTop = 160; 
    
    // Position A (Start) - Bias towards top-center, but safe from UI
    const ax = Math.max(paddingX, Math.min(width - paddingX, width / 2));
    const ay = Math.max(paddingTop, Math.min(height - paddingBottom - 200, height * 0.4));
    const a = { x: ax, y: ay };

    const radiusMeters = 0.02; 
    const radiusPixels = radiusMeters * ppm;
    
    // Position B (Target) - Randomly placed relative to A
    let bestB = { x: ax, y: ay + 200 }; 
    let found = false;
    
    // Try to find a good spot for B that is on screen and reasonably far
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI; // 0 to PI (mostly downwards movement preferred)
        const dist = 150 + Math.random() * 300; // 150px to 450px distance
        
        const bx = ax + Math.cos(angle) * dist;
        const by = ay + Math.sin(angle) * dist;
        
        // Ensure B is within bounds with padding
        if (bx > paddingX && bx < width - paddingX && by > paddingTop && by < height - paddingBottom) {
            bestB = { x: bx, y: by };
            found = true;
            break;
        }
    }
    
    if (!found) {
        // Fallback: Place B directly below A
        bestB = {
            x: ax,
            y: Math.min(height - paddingBottom, ay + 200)
        };
    }

    setPoints({ a, b: bestB });
  }, []);

  useEffect(() => {
    generatePoints();
    window.addEventListener('resize', generatePoints);
    return () => window.removeEventListener('resize', generatePoints);
  }, [generatePoints]);

  const processPointerEvent = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const ppm = getPPM();
    const now = performance.now();
    const nativeEvent = e.nativeEvent as PointerEvent;
    const events = nativeEvent.getCoalescedEvents ? nativeEvent.getCoalescedEvents() : [nativeEvent];
    
    events.forEach((event) => {
      const t = event.timeStamp || now;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (path.current.length > 0) {
        const last = path.current[path.current.length - 1];
        if (!last) return;

        const dt = (t - last.t) / 1000;
        
        if (dt > 0) {
          const dx = (x - last.x) / ppm;
          const dy = (y - last.y) / ppm;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const instV = dist / dt;
          const instA = (path.current.length > 1) ? (instV - last.v) / dt : 0;

          path.current.push({ t, x, y, v: instV, a: instA });
        }
      } else {
        path.current.push({ t, x, y, v: 0, a: 0 });
      }
    });
  };

  const startSequence = (e: React.PointerEvent) => {
    if (gameState !== 'idle') return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if(!rect) return;

    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const distToA = Math.sqrt(Math.pow(localX - points.a.x, 2) + Math.pow(localY - points.a.y, 2));

    if (distToA < 65) {
      const target = e.target as HTMLElement;
      target.setPointerCapture(e.pointerId);
      setIsHoldingA(true);
      setGameState('holding');
      
      const delay = 2000 + Math.random() * 3000;
      
      startTimeoutRef.current = setTimeout(() => {
          setGameState('active');
          goTimeRef.current = performance.now();
          path.current = [{ t: performance.now(), x: localX, y: localY, v: 0, a: 0 }];
      }, delay);
    }
  };

  const failGame = (reason: string) => {
      // Capture the exact point of violation if available
      if (path.current.length > 0) {
          const last = path.current[path.current.length - 1];
          setViolationPoint({ x: last.x, y: last.y });
      } else {
          setViolationPoint(null);
      }
      
      setGameState('failed');
      setFailReason(reason);
      setIsHoldingA(false);
      clearTimeout(startTimeoutRef.current);
      setResults(null); // Clear previous results
  };

  const handlePointerLeave = () => {
      if (gameState === 'active' || gameState === 'holding') {
          failGame("OUT OF BOUNDS");
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      if (gameState === 'holding') {
          clearTimeout(startTimeoutRef.current);
          setGameState('idle');
      } else if (gameState === 'active') {
          // Check Hit on B
          // Target B is drawn as w-16 h-16 (64px). Radius is 32px.
          // We'll give a slight leniency buffer (45px radius).
          
          if (path.current.length === 0) {
               failGame("NO MOVEMENT DETECTED");
               return;
          }

          const lastPoint = path.current[path.current.length - 1];
          const distToB = Math.sqrt(Math.pow(lastPoint.x - points.b.x, 2) + Math.pow(lastPoint.y - points.b.y, 2));
          
          if (distToB > 45) {
              failGame("MISSED TARGET");
          } else {
              setGameState('results'); 
              setViolationPoint(null);
              analyzeResults(); 
          }
      }
      setIsHoldingA(false);
  };

  const generateBioAnalysis = async (res: Results) => {
    if (!process.env.API_KEY) return;
    setIsAnalyzing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Act as a futuristic cybernetic physiologist. Analyze this reflex test data:
        - Visual Reaction Time: ${res.reactionTime.toFixed(0)}ms
        - Mechanical Travel Time: ${res.travelTime.toFixed(0)}ms
        - Accuracy Deviation: ${res.accuracy.toFixed(1)}mm
        - Path Efficiency: ${res.pathEfficiency.toFixed(1)}%
        
        Provide a JSON response with 4 keys:
        1. "synapticDelay": 1 short sentence about the retina-to-cortex path.
        2. "motorRecruitment": 1 short sentence about the signal traveling spine-to-muscle.
        3. "muscleFiberType": Guess the fiber composition (Fast Twitch IIb vs IIa) based on acceleration.
        4. "summary": A cool sci-fi diagnostic summary (max 15 words).
        
        Do not use markdown code blocks. Just raw JSON.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const text = response.text ? response.text.replace(/```json|```/g, '').trim() : "{}";
      const json = JSON.parse(text);
      setAnalysis(json);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeResults = () => {
    const data = path.current;
    if (data.length < 3) return;

    const ppm = getPPM();
    let onsetIdx = 0;
    const startPoint = data[0];
    const lastPoint = data[data.length - 1];
    
    for (let i = 0; i < data.length; i++) {
        const dx = (data[i].x - startPoint.x) / ppm;
        const dy = (data[i].y - startPoint.y) / ppm;
        if (Math.sqrt(dx*dx + dy*dy) > 0.002) {
            onsetIdx = i;
            break;
        }
    }
    
    const rawReaction = data[onsetIdx].t - goTimeRef.current;
    const reactionTime = Math.max(1, rawReaction - systemOverhead);
    
    const rawTravel = data[data.length - 1].t - data[onsetIdx].t;
    const travelTime = Math.max(1, rawTravel - (systemOverhead / 4));

    const peakV = Math.max(...data.map(p => p.v));
    const peakA = Math.max(...data.map(p => p.a));

    const distPx = Math.sqrt(Math.pow(lastPoint.x - points.b.x, 2) + Math.pow(lastPoint.y - points.b.y, 2));
    const accuracyMm = (distPx / ppm) * 1000;

    const idealDistPx = Math.sqrt(Math.pow(points.b.x - points.a.x, 2) + Math.pow(points.b.y - points.a.y, 2));
    let actualDistPx = 0;
    for (let i = 1; i < data.length; i++) {
       actualDistPx += Math.sqrt(Math.pow(data[i].x - data[i-1].x, 2) + Math.pow(data[i].y - data[i-1].y, 2));
    }
    const pathEfficiency = actualDistPx > 0 ? Math.min(100, (idealDistPx / actualDistPx) * 100) : 0;
    
    const tier = peakV > 1.5 ? 'ELITE TWITCH' : 'STANDARD';

    const finalResults = {
      reactionTime,
      travelTime,
      peakV,
      peakA,
      tier,
      accuracy: accuracyMm,
      pathEfficiency
    };

    setResults(finalResults);
    generateBioAnalysis(finalResults);

    // Save to History
    const newHistoryItem: HistoryItem = {
        id: Date.now(),
        date: new Date().toISOString(),
        reactionTime: finalResults.reactionTime,
        tier: tier
    };
    const updatedHistory = [...history, newHistoryItem];
    setHistory(updatedHistory);
    localStorage.setItem('strikeLab_history', JSON.stringify(updatedHistory));
  };

  const reset = () => {
    setGameState('idle');
    setResults(null);
    setAnalysis(null);
    setIsHoldingA(false);
    setViolationPoint(null);
    path.current = [];
    setReplayTime(0);
    setIsPlaying(false);
    generatePoints();
  };

  // --- REPLAY ENGINE ---
  const initReplay = (speed: number) => {
    if (path.current.length === 0) return;
    setGameState('replay');
    setReplaySpeed(speed);
    
    const startTime = goTimeRef.current;
    const endTime = path.current[path.current.length - 1].t;
    const duration = Math.max(100, endTime - startTime); // Ensure minimum duration
    setReplayDuration(duration);
    
    setReplayTime(0);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (gameState !== 'replay' || !isPlaying) {
      lastReplayTimeRef.current = null;
      cancelAnimationFrame(replayFrameRef.current);
      return;
    }

    const animate = (time: number) => {
      if (lastReplayTimeRef.current === null) {
        lastReplayTimeRef.current = time;
      }
      
      const delta = time - lastReplayTimeRef.current;
      lastReplayTimeRef.current = time;

      setReplayTime(prev => {
        let next = prev + (delta * replaySpeed);
        // Loop logic
        if (next >= replayDuration) {
           next = 0;
        }
        return next;
      });

      replayFrameRef.current = requestAnimationFrame(animate);
    };

    replayFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(replayFrameRef.current);
  }, [gameState, isPlaying, replaySpeed, replayDuration]);

  // Handle Scrubbing
  const handleSeek = (time: number) => {
      setReplayTime(time);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans select-none touch-none overflow-hidden relative">
      <div className="scanlines"></div>
      
      <Header 
        systemOverhead={systemOverhead} 
        deviceInfo={deviceInfo} 
        onOpenInfo={() => setShowInfo(true)}
        onOpenHistory={() => setShowHistory(true)}
      />

      <PlayArea 
        containerRef={containerRef}
        onPointerDown={startSequence}
        onPointerMove={(e) => gameState === 'active' && processPointerEvent(e)}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        points={points}
        gameState={gameState}
        isHoldingA={isHoldingA}
        path={path.current}
        results={results}
        replayTime={replayTime}
        goTime={goTimeRef.current}
        violationPoint={violationPoint}
      />

      {/* --- OVERLAYS --- */}
      
      {/* 1. Tutorial (New Users) */}
      {showTutorial && <TutorialOverlay onComplete={finishTutorial} />}

      {/* 2. Info Section (Manual) */}
      {showInfo && <InfoSection onClose={() => setShowInfo(false)} />}
      
      {/* 3. History Section (Manual) */}
      {showHistory && <HistorySection history={history} onClose={() => setShowHistory(false)} onClear={clearHistory} />}

      {/* 4. Failure Screen */}
      {gameState === 'failed' && (
          <div className="absolute inset-0 bg-red-900/90 backdrop-blur-xl z-50 flex items-center justify-center p-8">
              <div className="text-center">
                  <AlertTriangle size={64} className="text-white mx-auto mb-4 animate-bounce" />
                  <h2 className="text-4xl font-black italic uppercase text-white mb-2">TEST VOID</h2>
                  <p className="text-red-200 font-mono text-lg mb-8 uppercase tracking-widest border border-red-500/50 p-2 inline-block">
                     {failReason}
                  </p>
                  
                  <div className="flex gap-4 justify-center">
                    <button 
                        onClick={() => initReplay(0.5)}
                        className="bg-red-800/50 border border-red-400/30 text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-red-800/70 transition-colors flex items-center gap-2"
                    >
                        <PlayCircle size={16} /> Analyze Failure
                    </button>
                    <button 
                        onClick={reset}
                        className="bg-white text-red-900 px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <RotateCcw size={16} /> Retry
                    </button>
                  </div>
                  
                  <p className="text-sm text-red-200/60 max-w-sm mx-auto mt-8">
                      Fair Play Protocol: Review your replay to see exactly where the violation occurred.
                  </p>
              </div>
          </div>
      )}

      {/* 5. Results */}
      {gameState === 'results' && results && (
          <ResultsDashboard 
            results={results}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            deviceInfo={deviceInfo}
            systemOverhead={systemOverhead}
            onReplay={initReplay}
            onReset={reset}
            onShowAnalysis={() => setGameState('analysis')}
          />
      )}

      {/* 6. Replay (Works for Success AND Failure) */}
      {gameState === 'replay' && (
        <ReplayOverlay 
           replayTime={replayTime}
           duration={replayDuration}
           results={results}
           replaySpeed={replaySpeed}
           isPlaying={isPlaying}
           onTogglePlay={() => setIsPlaying(!isPlaying)}
           onSeek={handleSeek}
           onSpeedChange={setReplaySpeed}
           onStop={() => { setIsPlaying(false); setGameState(results ? 'results' : 'failed'); }}
           path={path.current}
           startTime={goTimeRef.current}
        />
      )}

      {/* 7. Analysis */}
      {gameState === 'analysis' && results && (
          <PathAnalysis 
              path={path.current}
              points={points}
              results={results}
              onBack={() => setGameState('results')}
          />
      )}

      <div className="p-4 flex justify-between items-center opacity-20 text-[7px] font-mono uppercase relative z-10">
        <span>Sampling: Variable-Rate Coalescence</span>
        <span>Filter: Savitzky-Golay Post-Process</span>
      </div>
    </div>
  );
};

export default App;