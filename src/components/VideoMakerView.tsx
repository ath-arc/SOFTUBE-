import { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Sparkles, 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Sliders, 
  Layers,
  ArrowRight,
  Tv,
  CheckCircle2,
  HardDriveUpload,
  Clock,
  RefreshCw
} from 'lucide-react';
import { VideoScene, DriveNode } from '../types';

interface VideoMakerViewProps {
  currentFolderId: string | null;
  onSaveToDrive: (name: string, content: string, videoData: any, folderId: string | null) => void;
  selectedVideoNode: DriveNode | null;
  onClearSelectedNode: () => void;
}

export default function VideoMakerView({
  currentFolderId,
  onSaveToDrive,
  selectedVideoNode,
  onClearSelectedNode
}: VideoMakerViewProps) {
  const [videoTitle, setVideoTitle] = useState('My First Live Scene Video');
  const [scenes, setScenes] = useState<VideoScene[]>([
    {
      id: 'sc-1',
      title: 'Neon Signals Detonation',
      subtitle: 'Deep inside the digital mainframe, a solitary neon signal explodes, triggering automated system logs.',
      duration: 5,
      environment: 'cyberpunk',
      particles: 'stars',
      character: 'astronaut',
      movement: 'float'
    },
    {
      id: 'sc-2',
      title: 'Decryption Sequence Matrix',
      subtitle: 'Decoded binary rain coordinates begin streaming into the holographic shield terminal.',
      duration: 6,
      environment: 'matrix',
      particles: 'dust',
      character: 'robot',
      movement: 'pulse'
    },
    {
      id: 'sc-3',
      title: 'Landing At Sunset Aurora',
      subtitle: 'The craft glides through a quiet neon aurora over the serene sunset shoreline, successfully completing the journey.',
      duration: 6,
      environment: 'sunset',
      particles: 'bubbles',
      character: 'bird',
      movement: 'glide'
    }
  ]);

  const [aiVideoPrompt, setAiVideoPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Active playing states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [elapsedInScene, setElapsedInScene] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleArray = useRef<any[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<any>(null);

  // Load from drive if selected
  useEffect(() => {
    if (selectedVideoNode && selectedVideoNode.videoData) {
      setVideoTitle(selectedVideoNode.videoData.title);
      setScenes(selectedVideoNode.videoData.scenes);
    }
  }, [selectedVideoNode]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAudioSynth();
    } else {
      setIsPlaying(true);
      setCurrentSceneIdx(0);
      setElapsedInScene(0);
      setupAudioSynth();
    }
  };

  // Clock progression for timeline playback
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setElapsedInScene(prev => {
        const currentScene = scenes[currentSceneIdx];
        if (prev + 1 >= currentScene.duration) {
          // Go to next scene or loop/stop
          if (currentSceneIdx + 1 < scenes.length) {
            setCurrentSceneIdx(curr => curr + 1);
            triggerSynthChord(scenes[currentSceneIdx + 1].environment);
            return 0;
          } else {
            // End of video timeline
            setIsPlaying(false);
            stopAudioSynth();
            return 0;
          }
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentSceneIdx, scenes]);

  // Audio Synthesizer: Dynamic procedural music based on active environments
  const setupAudioSynth = () => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
      
      const playBeat = () => {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        
        const env = scenes[currentSceneIdx]?.environment;
        
        // Synth osc
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        let freq = 110; // default low drone
        if (env === 'cyberpunk') freq = 130;
        else if (env === 'matrix') freq = 90;
        else if (env === 'serene') freq = 220;
        else if (env === 'sunset') freq = 165;
        else if (env === 'aurora') freq = 330;
        
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = env === 'cyberpunk' || env === 'matrix' ? 'sawtooth' : 'sine';
        
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      };

      playBeat();
      synthIntervalRef.current = setInterval(playBeat, 1500);
    } catch (e) {
      console.error("Synthesizer error:", e);
    }
  };

  const triggerSynthChord = (environment: string) => {
    const ctx = audioContextRef.current;
    if (!ctx || isAudioMuted) return;
    
    // Play a distinct chime when slides transition!
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    let note = 440; // A4
    if (environment === 'cyberpunk') note = 554.37; // C#5
    else if (environment === 'matrix') note = 523.25; // C5
    else if (environment === 'serene') note = 587.33; // D5
    else if (environment === 'sunset') note = 392.00; // G4
    else if (environment === 'aurora') note = 659.25; // E5

    osc.frequency.setValueAtTime(note, ctx.currentTime);
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  };

  const stopAudioSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }
  };

  const handleMuteToggle = () => {
    const nextMutedState = !isAudioMuted;
    setIsAudioMuted(nextMutedState);
    if (!nextMutedState && isPlaying) {
      // Lazy enable sound on the fly if playing!
      setTimeout(() => setupAudioSynth(), 100);
    } else {
      stopAudioSynth();
    }
  };

  // Canvas Animation Frame loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particleTicks = 0;

    const currentScene = scenes[isPlaying ? currentSceneIdx : 0];
    const env = currentScene?.environment || 'cyberpunk';
    const characterType = currentScene?.character || 'astronaut';
    const movement = currentScene?.movement || 'steady';
    const particleType = currentScene?.particles || 'none';

    // Set stable canvas resolution (640x360 fits 16:9 perfectly)
    canvas.width = 640;
    canvas.height = 360;

    // Initialize particles array on scene changed
    const setupParticles = () => {
      const arr = [];
      const count = particleType === 'none' ? 0 : 40;
      for (let i = 0; i < count; i++) {
        arr.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedY: Math.random() * 1.5 + 0.5,
          speedX: (Math.random() - 0.5) * 1.2,
          opacity: Math.random() * 0.7 + 0.3
        });
      }
      particleArray.current = arr;
    };

    setupParticles();

    const drawLoop = () => {
      const activeScene = scenes[isPlaying ? currentSceneIdx : 0];
      if (!activeScene) return;

      particleTicks += 0.05;

      // Make canvas backdrop gradients based on environmental selection
      let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (activeScene.environment === 'cyberpunk') {
        grad.addColorStop(0, '#0F172A'); // slate 900
        grad.addColorStop(1, '#1E1B4B'); // indigo 950
      } else if (activeScene.environment === 'serene') {
        grad.addColorStop(0, '#064E3B'); // emerald 950
        grad.addColorStop(1, '#022C22'); // teal 950
      } else if (activeScene.environment === 'sunset') {
        grad.addColorStop(0, '#78350F'); // amber 950
        grad.addColorStop(1, '#1C1917'); // stone 900
      } else if (activeScene.environment === 'matrix') {
        grad.addColorStop(0, '#022C22'); // deep forest
        grad.addColorStop(1, '#000000'); // black
      } else if (activeScene.environment === 'aurora') {
        grad.addColorStop(0, '#1E1B4B'); // indigo 950
        grad.addColorStop(1, '#311042'); // dark purple
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cyberpunk grid animation drawing
      if (activeScene.environment === 'cyberpunk') {
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)'; // pink tint grid
        ctx.lineWidth = 1;
        // Horizontal grid perspectivity lines
        const lineYOffset = (particleTicks * 15) % 40;
        for (let y = canvas.height / 2; y < canvas.height; y += 15) {
          ctx.beginPath();
          ctx.moveTo(0, y + lineYOffset);
          ctx.lineTo(canvas.width, y + lineYOffset);
          ctx.stroke();
        }
        // Vertical lines
        for (let x = -100; x < canvas.width + 100; x += 40) {
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2, canvas.height / 3);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
      }

      // Matrix falling numbers animation drawing
      if (activeScene.environment === 'matrix') {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
        ctx.font = '10px monospace';
        for (let i = 0; i < canvas.width; i += 20) {
          const char = Math.floor(Math.random() * 2);
          const y = (particleTicks * 60 + i) % canvas.height;
          ctx.fillText(String(char), i, y);
        }
      }

      // Glowing sunset sun circle
      if (activeScene.environment === 'sunset') {
        const sunRad = 55;
        let pGrad = ctx.createRadialGradient(canvas.width / 2, 130, 2, canvas.width / 2, 130, sunRad);
        pGrad.addColorStop(0, '#F59E0B'); // amber 500
        pGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 130, sunRad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Aurora wavy glowing arcs
      if (activeScene.environment === 'aurora') {
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)'; // emerald-400
        ctx.lineWidth = 30;
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#10B981';
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 20) {
          const y = 80 + Math.sin(x * 0.01 + particleTicks) * 25;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      // Draw particle layer
      if (activeScene.particles !== 'none') {
        particleArray.current.forEach(p => {
          ctx.fillStyle = activeScene.particles === 'dust' ? 'rgba(234, 179, 8, ' + p.opacity + ')' :
                         activeScene.particles === 'bubbles' ? 'rgba(56, 189, 248, ' + (p.opacity * 0.6) + ')' :
                         'rgba(255, 255, 255, ' + p.opacity + ')';
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Particle motions updating
          p.y += activeScene.particles === 'bubbles' ? -p.speedY : p.speedY;
          p.x += p.speedX;

          // Boundaries checking wrap-around
          if (p.y > canvas.height) p.y = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.x > canvas.width) p.x = 0;
          if (p.x < 0) p.x = canvas.width;
        });
      }

      // Compute character animations math based on chosen moves
      let charX = canvas.width / 2;
      let charY = canvas.height / 2 - 15;
      let rot = 0;
      let scale = 1;

      if (activeScene.movement === 'float') {
        charY += Math.sin(particleTicks * 3) * 16;
      } else if (activeScene.movement === 'glide') {
        charX += Math.cos(particleTicks * 2) * 80;
      } else if (activeScene.movement === 'pulse') {
        scale = 1 + Math.sin(particleTicks * 4) * 0.12;
      } else if (activeScene.movement === 'spin') {
        rot = particleTicks * 2;
      }

      // Draw Character Avatar Sprite
      if (activeScene.character !== 'none') {
        const spriteEmojis = {
          robot: '🤖',
          astronaut: '👨‍🚀',
          ninja: '🥷',
          bird: '🦜'
        };
        const activeEmoji = spriteEmojis[activeScene.character as keyof typeof spriteEmojis] || '🚀';

        ctx.save();
        ctx.translate(charX, charY);
        ctx.scale(scale, scale);
        ctx.rotate(rot);
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Character text projection shadow glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#F43F5E';
        ctx.fillText(activeEmoji, 0, 0);
        ctx.restore();
      }

      // Dynamic Scene label display overlay on canvas top (Left align)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(activeScene.title.toUpperCase(), 25, 35);

      // Subtitles typing display bottom overlay background bounds
      const sub = activeScene.subtitle;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // backdrop fill
      ctx.fillRect(15, canvas.height - 58, canvas.width - 30, 42);

      ctx.fillStyle = 'rgba(241, 245, 249, 1)'; // white text
      ctx.font = '11px sans-serif';
      
      // Split subtitles in lines if long to display on canvas beautifully
      const wrapSub = (txt: string, maxW: number) => {
        const words = txt.split(' ');
        const lines = [];
        let curr = '';
        words.forEach(w => {
          const test = curr + w + ' ';
          if (ctx.measureText(test).width > maxW) {
            lines.push(curr);
            curr = w + ' ';
          } else {
            curr = test;
          }
        });
        lines.push(curr);
        return lines;
      };

      const wrapped = wrapSub(sub, canvas.width - 60);
      wrapped.slice(0, 2).forEach((line, idx) => {
        ctx.fillText(line, 25, canvas.height - 42 + (idx * 14));
      });

      // Simple slide timeline bar progression
      ctx.fillStyle = '#4285F4';
      const progressWidth = isPlaying 
        ? ((elapsedInScene / activeScene.duration) * canvas.width) 
        : canvas.width;
      ctx.fillRect(0, canvas.height - 4, progressWidth, 4);

      animId = requestAnimationFrame(drawLoop);
    };

    drawLoop();

    return () => {
      cancelAnimationFrame(animId);
      stopAudioSynth();
    };
  }, [isPlaying, currentSceneIdx, scenes]);

  const handleUpdateScene = (id: string, field: keyof VideoScene, value: any) => {
    setScenes(prev => prev.map(sc => sc.id === id ? { ...sc, [field]: value } : sc));
  };

  const handleAddScene = () => {
    const nextId = 'sc-' + (scenes.length ? Math.max(...scenes.map(s => Number(s.id.split('-')[1]))) + 1 : 1);
    const newScene: VideoScene = {
      id: nextId,
      title: `Storyboard Scene ${scenes.length + 1}`,
      subtitle: 'Narration details about dynamic characters transitioning action sequences.',
      duration: 5,
      environment: 'serene',
      particles: 'snow',
      character: 'robot',
      movement: 'steady'
    };
    setScenes(prev => [...prev, newScene]);
  };

  const handleRemoveScene = (id: string) => {
    setScenes(prev => prev.filter(sc => sc.id !== id));
  };

  const handleMoveScene = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === scenes.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...scenes];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setScenes(updated);
  };

  // AI Script Narrative Timeline generator using `/api/gemini/gen-video`
  const handleAiVideoGen = async () => {
    if (!aiVideoPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/gen-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiVideoPrompt })
      });

      if (!res.ok) throw new Error('API server failed');
      const data = await res.json();

      if (data.title) setVideoTitle(data.title);
      if (data.scenes) {
        setScenes(data.scenes);
      }
      setAiVideoPrompt('');
    } catch (err: any) {
      console.error(err);
      alert('AI Generation issue: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert timeline configuration into drive node structure
  const handleSaveVideoToDrive = () => {
    const compiledData = {
      title: videoTitle,
      scenes: scenes
    };

    let scriptText = `# VIDEO STORYBOARD: ${videoTitle}\n\n`;
    scriptText += `*Total Duration: ${scenes.reduce((acc, s) => acc + s.duration, 0)}s • Created in CineLive Studio*\n\n`;
    scenes.forEach((s, idx) => {
      scriptText += `## Scene ${idx + 1}: ${s.title}\n`;
      scriptText += `- Narration/Subtitles: "${s.subtitle}"\n`;
      scriptText += `- Visual Backdrop: ${s.environment} (Particles: ${s.particles})\n`;
      scriptText += `- Moving Avatar: ${s.character} (Physics: ${s.movement})\n`;
      scriptText += `- Duration: ${s.duration} seconds\n\n`;
    });

    onSaveToDrive(videoTitle + ".video", scriptText, compiledData, currentFolderId);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900 text-slate-100 font-sans p-6" id="video-maker-root">
      
      {/* Visual Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4" id="video-header-row">
        <div className="flex items-center gap-3" id="video-logo-tag">
          <div className="p-3 bg-emerald-950/40 text-emerald-400 rounded-2xl border border-emerald-500/20" id="video-badge">
            <Tv className="h-8 w-8 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              CineLive (Videos Maker)
              <span className="text-xs py-0.5 px-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full font-mono">LIVE-STAGE</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Construct cinematic scene timelines. Write automated screenplay prompts using Gemini AI, play animated canvases with synthesizers, and export directly back to SOFTDRIVE.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" id="header-video-actions">
          {selectedVideoNode && (
            <button
              id="close-loaded-video-btn"
              onClick={onClearSelectedNode}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition"
            >
              Close Loaded Timeline
            </button>
          )}

          <button
            id="video-save-btn"
            onClick={handleSaveVideoToDrive}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition"
          >
            <HardDriveUpload className="h-3.5 w-3.5" />
            <span>Save to SOFTDRIVE</span>
          </button>
        </div>
      </div>

      {isSavedNotice && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-3 rounded-xl mt-4 flex items-center gap-2" id="saved-video-banner">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Success! Storyboard <strong>"{videoTitle}"</strong> has been saved directly to your workspace. Check "SOFTDRIVE" directory structure.</span>
        </div>
      )}

      {/* Main timeline canvas panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start" id="video-builder-columns">
        
        {/* Left Column: Canvas, playback controls & ambient console (Span 6) */}
        <div className="lg:col-span-6 space-y-6" id="left-video-pane">
          
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 overflow-hidden relative shadow-2xl" id="tv-stage-box">
            
            {/* Stage Title */}
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400 mb-3" id="tv-stage-header">
              <span className="flex items-center gap-1 bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                <span className={`h-1.5 w-1.5 rounded-full bg-rose-500 ${isPlaying ? 'animate-ping' : ''}`} />
                {isPlaying ? `STAGE ACTIVE - PLAYING SCENE ${currentSceneIdx + 1}` : 'STAGE ARMED - PAUSED'}
              </span>
              <span>HD 640x360 RESOLUTION</span>
            </div>

            {/* Simulated Live Canvas */}
            <div className="w-full aspect-[16/9] bg-black rounded-lg overflow-hidden border border-slate-850 relative" id="canvas-wrapper">
              <canvas 
                id="live-stage-canvas"
                ref={canvasRef} 
                className="w-full h-full block cursor-pointer"
                onClick={handleTogglePlay}
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between mt-4" id="playback-toolbar">
              <div className="flex items-center gap-2" id="main-controls">
                <button
                  id="playback-play-btn"
                  onClick={handleTogglePlay}
                  className={`px-4.5 py-2.5 rounded-xl font-bold text-xs tracking-tight transition-all flex items-center gap-1.5 ${
                    isPlaying 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isPlaying ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  <span>{isPlaying ? 'COMPILE & STOP' : 'COMPILE & PLAY'}</span>
                </button>

                {/* Synth audio toggle */}
                <button
                  id="mute-toggle-btn"
                  onClick={handleMuteToggle}
                  className={`p-2.5 rounded-xl border transition ${
                    isAudioMuted 
                      ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-350' 
                      : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/50'
                  }`}
                  title={isAudioMuted ? 'Unmute Procedural Audio' : 'Mute Sound'}
                >
                  {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>

              {/* Status information */}
              {isPlaying && (
                <div className="text-right text-xs font-mono text-slate-400" id="chronicle-tracker">
                  <span className="block font-bold text-slate-200">Scene Elapsed: {elapsedInScene}s / {scenes[currentSceneIdx]?.duration}s</span>
                  <span className="text-[10px] text-slate-500">Timeline node count: {currentSceneIdx + 1}/{scenes.length}</span>
                </div>
              )}
            </div>

          </div>

          {/* AI Storyboard script Generator */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5" id="ai-script-generator">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400 fill-current" />
              Gemini AI Direct Storyboarder
            </h3>

            <div className="flex gap-2" id="ai-video-input-group">
              <input
                id="ai-video-prompt"
                type="text"
                placeholder="PROMPT: 'A high-speed cyber motorcycle race under digital weather'..."
                value={aiVideoPrompt}
                onChange={(e) => setAiVideoPrompt(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-400 focus:outline-none placeholder-slate-500"
              />
              <button
                id="ai-video-btn"
                onClick={handleAiVideoGen}
                disabled={isGenerating || !aiVideoPrompt.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:bg-slate-800 disabled:text-slate-500 flex items-center gap-1"
              >
                {isGenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>{isGenerating ? 'Writing Storyboard...' : 'AI Generate'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Scene editors / timing configs (Span 6) */}
        <div className="lg:col-span-6 space-y-4" id="right-video-pane">
          
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5" id="storyboard-panel">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3" id="storyboard-header">
              <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-emerald-400" />
                Active Cinematic Timeline Timeline ({scenes.length} sections)
              </h3>
              <button
                id="add-scene-btn"
                onClick={handleAddScene}
                className="flex items-center gap-1 text-xs text-emerald-400 font-bold hover:text-emerald-300 transition"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3px]" />
                <span>Inject Scene</span>
              </button>
            </div>

            {/* Base properties label */}
            <div className="mb-4" id="video-title-property">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Cine Title Name</label>
              <input
                id="video-title-input"
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.8 text-xs text-white placeholder-slate-650 focus:ring-1 focus:ring-emerald-400 focus:outline-none font-bold"
              />
            </div>

            {/* Dynamic slides timeline list */}
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1" id="timeline-scroll">
              {scenes.map((scItem, index) => (
                <div 
                  key={scItem.id} 
                  className={`p-4 rounded-xl border bg-slate-900/40 relative shadow-sm transition duration-200 ${
                    isPlaying && currentSceneIdx === index 
                      ? 'border-emerald-500/60 bg-emerald-950/10' 
                      : 'border-slate-800/80'
                  }`}
                  id={`timeline-scene-editor-${scItem.id}`}
                >
                  {/* Slide numbering header */}
                  <div className="flex justify-between items-center mb-3" id={`scene-editor-header-${scItem.id}`}>
                    <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold uppercase" id="numbering">
                      <span className={`px-1.5 py-0.5 rounded ${
                        isPlaying && currentSceneIdx === index ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
                      }`} id="badge">
                        Scene {index + 1}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">ID: {scItem.id}</span>
                    </div>

                    <div className="flex items-center gap-2" id={`scene-actions-${scItem.id}`}>
                      {/* Movement arrange sliders directions */}
                      <button
                        id={`scene-move-up-${scItem.id}`}
                        onClick={() => handleMoveScene(index, 'up')}
                        disabled={index === 0}
                        className="text-slate-500 hover:text-indigo-400 disabled:opacity-20 transition text-xs"
                      >
                        ▲
                      </button>
                      <button
                        id={`scene-move-down-${scItem.id}`}
                        onClick={() => handleMoveScene(index, 'down')}
                        disabled={index === scenes.length - 1}
                        className="text-slate-500 hover:text-indigo-400 disabled:opacity-20 transition text-xs"
                      >
                        ▼
                      </button>
                      
                      <button
                        id={`delete-scene-${scItem.id}`}
                        onClick={() => handleRemoveScene(scItem.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Operational Settings Fields */}
                  <div className="space-y-3" id={`editor-grid-${scItem.id}`}>
                    <div className="grid grid-cols-2 gap-3" id={`upper-fields-${scItem.id}`}>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Visual Title text</label>
                        <input
                          id={`scene-title-input-${scItem.id}`}
                          type="text"
                          value={scItem.title}
                          onChange={(e) => handleUpdateScene(scItem.id, 'title', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Time (Seconds)</label>
                        <input
                          id={`scene-dur-input-${scItem.id}`}
                          type="number"
                          min={2}
                          max={15}
                          value={scItem.duration}
                          onChange={(e) => handleUpdateScene(scItem.id, 'duration', parseInt(e.target.value) || 2)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3" id={`middle-fields-${scItem.id}`}>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Environment backdrop</label>
                        <select
                          id={`scene-env-select-${scItem.id}`}
                          value={scItem.environment}
                          onChange={(e) => handleUpdateScene(scItem.id, 'environment', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                        >
                          <option value="cyberpunk">Cyberpunk neon</option>
                          <option value="matrix">Matrix falling rain</option>
                          <option value="serene">Serene forest</option>
                          <option value="sunset">Sunset shoreline</option>
                          <option value="aurora">Aurora violet</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Overlaid Particle</label>
                        <select
                          id={`scene-particles-select-${scItem.id}`}
                          value={scItem.particles}
                          onChange={(e) => handleUpdateScene(scItem.id, 'particles', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                        >
                          <option value="none">None</option>
                          <option value="stars">Star points</option>
                          <option value="snow">Snow flakes</option>
                          <option value="bubbles">Teal bubbles</option>
                          <option value="dust">Gold spores</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3" id={`lower-fields-${scItem.id}`}>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Sprite Character avatar</label>
                        <select
                          id={`scene-char-select-${scItem.id}`}
                          value={scItem.character}
                          onChange={(e) => handleUpdateScene(scItem.id, 'character', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                        >
                          <option value="none">None</option>
                          <option value="astronaut">👨‍🚀 Astronaut</option>
                          <option value="robot">🤖 Robot Drone</option>
                          <option value="ninja">🥷 Cyber Ninja</option>
                          <option value="bird">🦜 Zenith Bird</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Avatar movement kinetics</label>
                        <select
                          id={`scene-move-select-${scItem.id}`}
                          value={scItem.movement}
                          onChange={(e) => handleUpdateScene(scItem.id, 'movement', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                        >
                          <option value="steady">Steady</option>
                          <option value="float">Sine float (Y)</option>
                          <option value="glide">Horizontal sweep (X)</option>
                          <option value="pulse">Breathing Pulse (Scale)</option>
                          <option value="spin">Smooth orbit (Spin)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Screen Narration / SubtitlesText</label>
                      <textarea
                        id={`scene-sub-textarea-${scItem.id}`}
                        rows={2}
                        value={scItem.subtitle}
                        onChange={(e) => handleUpdateScene(scItem.id, 'subtitle', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
