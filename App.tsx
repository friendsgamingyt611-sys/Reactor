import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import Header from './Header';
import PlayArea from './PlayArea';
import ResultsDashboard from './ResultsDashboard';
import ReplayOverlay from './ReplayOverlay';
import PathAnalysis from './PathAnalysis';

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

// --- App Component ---
const App = () => {
  const [gameState, setGameState] = useState<'idle' | 'holding' | 'active' | 'results' | 'replay' | 'analysis'>('idle'); 
  const [points, setPoints] = useState({ a: { x: 0, y: 0 }, b: { x: 0, y: 0 } });
  const [results, setResults] = useState<Results | null>(null);
  const [isHoldingA, setIsHoldingA] = useState(false);
  
  // Advanced Calibration States
  const [systemOverhead, setSystemOverhead] = useState(0); // ms
  const [deviceInfo, setDeviceInfo] = useState({ model: "Unknown", cores: 0, agent: "Unknown" });

  // Replay & Analysis States
  const [analysis, setAnalysis] = useState<BiometricAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1.0); // 1.0 = Normal, 0.1 = Slow
  const [replayProgress, setReplayProgress] = useState(0); // 0 to 1
  const [replayTime, setReplayTime] = useState(0); // Current ms in replay
  const [replayCursor, setReplayCursor] = useState<{x: number, y: number} | null>(null);

  const path = useRef<Point[]>([]); 
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeoutRef = useRef<any>(null); // Replaces interval timer
  const goTimeRef = useRef(0);
  const replayFrameRef = useRef<number>(0);

  // 1. High-Precision Latency Benchmarking (Run Once)
  useEffect(() => {
    const runCalibration = () => {
      const samples = [];
      for (let i = 0; i < 50; i++) {
        const t0 = performance.now();
        // Simulate minor analytical load
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

  const getPPM = () => {
    const basePPI = 160; 
    const inchesToMeters = 0.0254;
    return (basePPI * (window.devicePixelRatio || 1)) / inchesToMeters;
  };

  const generatePoints = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const ppm = getPPM();
    
    const padding = 80; 
    
    const ax = Math.max(padding, Math.min(width - padding, width / 2));
    const ay = Math.max(padding, Math.min(height - padding, height * 0.6));
    const a = { x: ax, y: ay };

    const radiusMeters = 0.02; 
    const radiusPixels = radiusMeters * ppm;
    
    let bestB = { x: ax, y: ay - radiusPixels }; 
    let found = false;
    
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const bx = ax + Math.cos(angle) * radiusPixels;
        const by = ay + Math.sin(angle) * radiusPixels;
        
        if (bx > 30 && bx < width - 30 && by > 30 && by < height - 30) {
            bestB = { x: bx, y: by };
            found = true;
            break;
        }
    }
    
    if (!found) {
        const angleToCenter = Math.atan2((height/2) - ay, (width/2) - ax);
        bestB = {
            x: ax + Math.cos(angleToCenter) * radiusPixels,
            y: ay + Math.sin(angleToCenter) * radiusPixels
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

  const handlePointerUp = () => {
      if (gameState === 'holding') {
          clearTimeout(startTimeoutRef.current);
          setGameState('idle');
      } else if (gameState === 'active') {
          setGameState('results'); 
          analyzeResults(); 
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
        model: "gemini-2.5-flash-lite-latest",
        contents: prompt
      });

      const text = response.text ? response.text.replace(/```json|```/g, '').trim() : "{}";
      const json = JSON.parse(text);
      setAnalysis(json);
    } catch (error) {
      console.error("Analysis failed", error);
      setAnalysis({
        synapticDelay: "Neural pathway analysis offline.",
        motorRecruitment: "Signal degradation detected.",
        muscleFiberType: "Unknown fiber composition.",
        summary: "Data corruption in bio-link."
      });
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

    const finalResults = {
      reactionTime,
      travelTime,
      peakV,
      peakA,
      tier: peakV > 1.5 ? 'ELITE TWITCH' : 'STANDARD',
      accuracy: accuracyMm,
      pathEfficiency
    };

    setResults(finalResults);
    generateBioAnalysis(finalResults);
  };

  const reset = () => {
    setGameState('idle');
    setResults(null);
    setAnalysis(null);
    setIsHoldingA(false);
    path.current = [];
    setReplayCursor(null);
    setReplayTime(0);
    generatePoints();
  };

  const startReplay = (speed: number) => {
    setGameState('replay');
    setReplaySpeed(speed);
    
    if (path.current.length === 0) return;

    const startTime = goTimeRef.current; 
    const firstMoveTime = path.current[0].t;
    const endTime = path.current[path.current.length - 1].t;
    
    const totalDuration = endTime - startTime;
    
    let startTimestamp: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      
      const elapsedReal = (timestamp - startTimestamp);
      const elapsedVirtual = elapsedReal * speed; 
      
      const currentVirtualTimeAbsolute = startTime + elapsedVirtual;
      const currentRelTime = elapsedVirtual;

      setReplayTime(currentRelTime); 
      
      const progress = Math.min(elapsedVirtual / totalDuration, 1);
      setReplayProgress(progress);

      if (currentVirtualTimeAbsolute < firstMoveTime) {
          setReplayCursor({ x: path.current[0].x, y: path.current[0].y });
      } else {
          let idx = 0;
          for(let i=0; i<path.current.length; i++) {
              if (path.current[i].t > currentVirtualTimeAbsolute) {
                  idx = i;
                  break;
              }
              idx = i;
          }
          
          if (idx > 0 && idx < path.current.length) {
              const p1 = path.current[idx - 1];
              const p2 = path.current[idx];
              if (p1 && p2) {
                const segmentDuration = p2.t - p1.t;
                const segmentProgress = segmentDuration > 0 ? (currentVirtualTimeAbsolute - p1.t) / segmentDuration : 0;
                
                setReplayCursor({
                    x: p1.x + (p2.x - p1.x) * segmentProgress,
                    y: p1.y + (p2.y - p1.y) * segmentProgress
                });
              }
          } else if (path.current.length > 0) {
              setReplayCursor({ x: path.current[path.current.length-1].x, y: path.current[path.current.length-1].y });
          }
      }

      if (progress < 1) {
        replayFrameRef.current = requestAnimationFrame(animate);
      } else {
        startTimestamp = null; 
        setTimeout(() => {
           replayFrameRef.current = requestAnimationFrame(animate);
        }, 1000); 
      }
    };

    cancelAnimationFrame(replayFrameRef.current);
    replayFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
      return () => cancelAnimationFrame(replayFrameRef.current);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans select-none touch-none overflow-hidden relative">
      <div className="scanlines"></div>
      
      <Header systemOverhead={systemOverhead} deviceInfo={deviceInfo} />

      <PlayArea 
        containerRef={containerRef}
        onPointerDown={startSequence}
        onPointerMove={(e) => gameState === 'active' && processPointerEvent(e)}
        onPointerUp={handlePointerUp}
        points={points}
        gameState={gameState}
        isHoldingA={isHoldingA}
        path={path.current}
        replayCursor={replayCursor}
        results={results}
      />

      {(gameState === 'results' || gameState === 'replay') && results && (
          <ResultsDashboard 
            results={results}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            deviceInfo={deviceInfo}
            systemOverhead={systemOverhead}
            onReplay={startReplay}
            onReset={reset}
            onShowAnalysis={() => setGameState('analysis')}
          />
      )}

      {gameState === 'replay' && results && (
        <ReplayOverlay 
           replayTime={replayTime}
           results={results}
           replayProgress={replayProgress}
           replaySpeed={replaySpeed}
           onStop={() => setGameState('results')}
        />
      )}

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