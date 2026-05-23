import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { 
  Camera, 
  Sparkles, 
  Upload, 
  Download, 
  Sliders, 
  Type, 
  RotateCcw, 
  CheckCircle2, 
  HardDriveUpload, 
  Filter, 
  Sun, 
  Contrast, 
  Smile, 
  Save, 
  Image as ImageIcon 
} from 'lucide-react';
import { DriveNode } from '../types';

interface PhotoMakerViewProps {
  currentFolderId: string | null;
  onSaveToDrive: (name: string, content: string, appData: any, folderId: string | null) => void;
  // If we open a photo file from Drive, let's load it
  selectedPhotoNode: DriveNode | null;
  onClearSelectedNode: () => void;
}

export default function PhotoMakerView({
  currentFolderId,
  onSaveToDrive,
  selectedPhotoNode,
  onClearSelectedNode
}: PhotoMakerViewProps) {
  const [photoTitle, setPhotoTitle] = useState('My Portrait Shot');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Source image representation (can be uploaded, generated, or loaded from Drive)
  const [srcImage, setSrcImage] = useState<string>('https://picsum.photos/seed/aurashot/800/800');
  
  // Custom Filters state
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);

  // Frames & Templates state
  const [activeFrame, setActiveFrame] = useState<'none' | 'polaroid' | 'cyberpunk' | 'vhs' | 'minimal-black'>('none');
  
  // Text Overlays state
  const [textTop, setTextTop] = useState('');
  const [textBottom, setTextBottom] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Impact, sans-serif');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load from drive if selected node is an image
  useEffect(() => {
    if (selectedPhotoNode && selectedPhotoNode.content) {
      setPhotoTitle(selectedPhotoNode.name.replace(/\.[^/.]+$/, ''));
      setSrcImage(selectedPhotoNode.content);
      // Try to restore custom metadata if it was stored
      const custom = selectedPhotoNode.photoData;
      if (custom) {
        try {
          if (custom.brightness !== undefined) setBrightness(custom.brightness);
          if (custom.contrast !== undefined) setContrast(custom.contrast);
          if (custom.saturation !== undefined) setSaturation(custom.saturation);
          if (custom.blur !== undefined) setBlur(custom.blur);
          if (custom.grayscale !== undefined) setGrayscale(custom.grayscale);
          if (custom.sepia !== undefined) setSepia(custom.sepia);
          if (custom.hueRotate !== undefined) setHueRotate(custom.hueRotate);
          if (custom.activeFrame !== undefined) setActiveFrame(custom.activeFrame);
          if (custom.textTop !== undefined) setTextTop(custom.textTop);
          if (custom.textBottom !== undefined) setTextBottom(custom.textBottom);
          if (custom.textColor !== undefined) setTextColor(custom.textColor);
          if (custom.fontSize !== undefined) setFontSize(custom.fontSize);
          if (custom.fontFamily !== undefined) setFontFamily(custom.fontFamily);
        } catch (e) {
          console.warn("Could not restore custom photo properties", e);
        }
      }
    }
  }, [selectedPhotoNode]);

  // Redraw canvas whenever parameters change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = srcImage;

    img.onload = () => {
      // Setup resolution
      canvas.width = 800;
      canvas.height = 800;

      // Draw clean canvas state
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Define drawing area (frame adjustments)
      let drawX = 0;
      let drawY = 0;
      let drawW = canvas.width;
      let drawH = canvas.height;

      // Adjust image draw offset if activePolaroid frame
      if (activeFrame === 'polaroid') {
        drawX = 40;
        drawY = 40;
        drawW = canvas.width - 80;
        drawH = canvas.height - 180;
      } else if (activeFrame === 'cyberpunk') {
        drawX = 20;
        drawY = 20;
        drawW = canvas.width - 40;
        drawH = canvas.height - 40;
      } else if (activeFrame === 'vhs') {
        drawX = 15;
        drawY = 15;
        drawW = canvas.width - 30;
        drawH = canvas.height - 30;
      } else if (activeFrame === 'minimal-black') {
        drawX = 50;
        drawY = 50;
        drawW = canvas.width - 100;
        drawH = canvas.height - 100;
      }

      // Draw backing for frames before applying filters to image
      if (activeFrame === 'polaroid') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Soft polaroid shadow inner
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(drawX, drawY, drawW, drawH);
      } else if (activeFrame === 'cyberpunk') {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // glowing grid pattern border
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      } else if (activeFrame === 'minimal-black') {
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Save context to apply filters only to the loaded photo image
      ctx.save();
      
      // Apply CSS-like Filters to Context
      ctx.filter = `
        brightness(${brightness}%)
        contrast(${contrast}%)
        saturate(${saturation}%)
        blur(${blur}px)
        grayscale(${grayscale}%)
        sepia(${sepia}%)
        hue-rotate(${hueRotate}deg)
      `;

      // Draw Centered object
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Draw frames overlay elements after image filtering
      if (activeFrame === 'cyberpunk') {
        // Futuristic target sights
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 40, 0, Math.PI * 2);
        ctx.moveTo(canvas.width / 2 - 60, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + 60, canvas.height / 2);
        ctx.moveTo(canvas.width / 2, canvas.height / 2 - 60);
        ctx.lineTo(canvas.width / 2, canvas.height / 2 + 60);
        ctx.stroke();

        ctx.fillStyle = '#f43f5e';
        ctx.font = '800 13px monospace';
        ctx.fillText('AURA_GRID v4.1 SECURE SHOT_READY', 35, 45);
        ctx.fillText('SYS_LOG: ALIVE', canvas.width - 180, canvas.height - 35);
      } else if (activeFrame === 'vhs') {
        // VHS scanlines and digital play labels
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        for (let i = 0; i < canvas.height; i += 8) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 26px monospace';
        ctx.fillText('▶ PLAY', 40, 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('SP 0:00:15', 40, 95);
        ctx.fillText('MARCH 23 2026', canvas.width - 200, canvas.height - 40);
      } else if (activeFrame === 'polaroid') {
        // Polaroid bottom text spot shadow marker
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX, drawY, drawW, drawH);
      }

      // Apply customize text top & bottom overlays
      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';

      // Top text rendering with a readable thick shadow
      if (textTop.trim()) {
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';
        
        const yTop = activeFrame === 'polaroid' ? 90 : 65;
        ctx.strokeText(textTop.toUpperCase(), canvas.width / 2, yTop);
        ctx.fillText(textTop.toUpperCase(), canvas.width / 2, yTop);
      }

      // Bottom text rendering
      if (textBottom.trim()) {
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';
        
        let yBot = canvas.height - 65;
        // Polaroid bottom font style has a relaxed, handwriting vibe
        if (activeFrame === 'polaroid') {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'transparent';
          ctx.fillStyle = '#1e293b'; // slate dark handwriting look
          ctx.font = `normal 28px "Playfair Display", Georgia, serif`;
          yBot = canvas.height - 70;
        }

        if (activeFrame === 'polaroid') {
          ctx.fillText(textBottom, canvas.width / 2, yBot);
        } else {
          ctx.strokeText(textBottom.toUpperCase(), canvas.width / 2, yBot);
          ctx.fillText(textBottom.toUpperCase(), canvas.width / 2, yBot);
        }
      }

      // Clear shadows
      ctx.shadowBlur = 0;
    };
  }, [srcImage, brightness, contrast, saturation, blur, grayscale, sepia, hueRotate, activeFrame, textTop, textBottom, textColor, fontSize, fontFamily]);

  // Handle Photo Generator via Server Endpoint `/api/gemini/gen-photo`
  const handleAiPhotoGen = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/gen-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt,
          style: 'hyperrealistic digital photography',
          aspectRatio: '1:1'
        })
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();

      if (data.imageUrl) {
        setSrcImage(data.imageUrl);
        setPhotoTitle("AuraShot: " + prompt.slice(0, 20));
      }
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      alert('AI Generation issue: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Upload custom file directly into Photo Maker
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string || '';
      setSrcImage(base64);
      setPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsDataURL(file);
  };

  // Reset all custom parameters
  const handleResetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setGrayscale(0);
    setSepia(0);
    setHueRotate(0);
    setActiveFrame('none');
    setTextTop('');
    setTextBottom('');
  };

  // Export current edited canvas texture back to SOFTDRIVE
  const handleSaveToSoftdrive = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const outputDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // Store customization parameters inside the appData object so they reload properly
    const photoDetailsMetadata = {
      brightness,
      contrast,
      saturation,
      blur,
      grayscale,
      sepia,
      hueRotate,
      activeFrame,
      textTop,
      textBottom,
      textColor,
      fontSize,
      fontFamily
    };

    // Trigger save file behavior in drive nodes list
    onSaveToDrive(photoTitle, outputDataUrl, photoDetailsMetadata, currentFolderId);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  // Local device helper trigger
  const handleLocalDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${photoTitle.trim().replace(/\s+/g, '_')}_studio.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900 text-slate-100 font-sans p-6" id="photo-maker-root">
      
      {/* Title Header area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4" id="photo-maker-header">
        <div className="flex items-center gap-3" id="photo-logo-wrapper">
          <div className="p-3 bg-rose-950/40 text-rose-400 rounded-2xl border border-rose-500/20" id="photo-icon-box">
            <Camera className="h-8 w-8 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AuraShot (Photo Maker)
              <span className="text-xs py-0.5 px-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full font-mono">STUDIO</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Apply high-fidelity filters, style frames/polaroids, overlay meme macros of your uploaded images, or summon photorealistic models using Gemini's active Imagen engine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" id="header-photo-actions">
          {selectedPhotoNode && (
            <button
              id="close-loaded-photo-btn"
              onClick={onClearSelectedNode}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition cursor-pointer"
            >
              Close Loaded Photo
            </button>
          )}

          <button
            id="photo-save-softdrive-btn"
            onClick={handleSaveToSoftdrive}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md transition cursor-pointer"
          >
            <HardDriveUpload className="h-3.5 w-3.5" />
            <span>Save to SOFTDRIVE</span>
          </button>
        </div>
      </div>

      {isSavedNotice && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-3 rounded-xl mt-4 flex items-center gap-2 animate-in fade-in" id="saved-photo-banner">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Success! Radiant Photo <strong>"{photoTitle}"</strong> has been saved directly to your workspace. Check your SOFTDRIVE files directory.</span>
        </div>
      )}

      {/* Primary Layout sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start" id="photo-maker-grid">
        
        {/* Left Column: Instant Canvas preview area & AI Gen console (Span 6) */}
        <div className="lg:col-span-6 space-y-6" id="left-art-pane">
          
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 shadow-2xl relative flex flex-col items-center" id="canvas-backboard">
            
            <div className="w-full flex justify-between items-center text-xs font-mono font-bold text-slate-400 mb-4" id="canvas-header-info">
              <span className="flex items-center gap-1 bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded border border-rose-500/20">
                AURASHOT ACTIVE PREVIEW
              </span>
              <span>HD SQUARE 800x800</span>
            </div>

            {/* Canvas viewport */}
            <div className="relative w-full max-w-[420px] aspect-square bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center p-1" id="canvas-mount-point">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full block rounded-lg shadow-2xl object-contain bg-slate-900"
                id="photo-studio-canvas"
              />
            </div>

            {/* Quick Helper buttons */}
            <div className="w-full flex items-center justify-between gap-3 mt-4" id="under-canvas-toolbar">
              <div className="flex items-center gap-2" id="toolbar-left-buttons">
                {/* Custom File Upload Input */}
                <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="canvas-upload-control"
                  />
                </label>

                <button
                  id="reset-filter-btn"
                  onClick={handleResetFilters}
                  className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                  title="Reset Filter Sliders"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <button
                id="save-local-disk-btn"
                onClick={handleLocalDownload}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download JPG</span>
              </button>
            </div>

          </div>

          {/* Prompt to Photo generator */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5" id="photo-prompter-box">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400 fill-current" />
              Imagen 3 AI Photo Generator
            </h3>

            <div className="flex gap-2" id="ai-prompter-group">
              <input
                id="ai-photo-prompt-input"
                type="text"
                placeholder="PROMPT: 'Polaroid selfie of a cyberpunk cat overlooking Tokyo skyline at golden hour'..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-1 focus:ring-rose-400 focus:outline-none placeholder-slate-600 font-sans"
              />
              <button
                id="ai-photo-btn"
                onClick={handleAiPhotoGen}
                disabled={isGenerating || !prompt.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition disabled:bg-slate-800 disabled:text-slate-500 flex items-center gap-1 cursor-pointer"
              >
                {isGenerating ? (
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{isGenerating ? 'Drafting...' : 'AI Generate'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Interactive studio sliders, presets, overlay text (Span 6) */}
        <div className="lg:col-span-6 space-y-4" id="right-art-pane">
          
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-5" id="photo-properties-editor">
            
            {/* Title Property element */}
            <div id="photo-name-prop">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">ELEGANT FILE TITLE</label>
              <input
                id="photo-title-meta-input"
                type="text"
                value={photoTitle}
                onChange={(e) => setPhotoTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-rose-400 focus:outline-none text-white font-bold"
              />
            </div>

            {/* Presets & frames */}
            <div id="preset-frames-section">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1">
                <Filter className="h-3 w-3 text-rose-400" />
                CHOOSE AURASHOT FRAME STYLE
              </label>
              
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2" id="frames-selector-grid">
                {[
                  { id: 'none', label: 'None 🖼️' },
                  { id: 'polaroid', label: 'Polaroid 📸' },
                  { id: 'cyberpunk', label: 'Neon Cyber ⚡' },
                  { id: 'vhs', label: 'VHS Tape 📼' },
                  { id: 'minimal-black', label: 'Warm Dark 🖤' }
                ].map((fr) => (
                  <button
                    key={fr.id}
                    id={`frame-btn-${fr.id}`}
                    onClick={() => setActiveFrame(fr.id as any)}
                    className={`px-2 py-2.5 rounded-lg border text-center text-[10px] font-bold tracking-tight transition cursor-pointer ${
                      activeFrame === fr.id 
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300' 
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {fr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SLIDERS SPECIFIC FILTER PANEL */}
            <div className="space-y-4 pt-1" id="filter-sliders-panel">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-1">
                <Sliders className="h-3 w-3 text-rose-400" />
                MANUAL FILTERS ADJUSTMENT
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="sliders-mesh">
                {/* Brightness */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span className="flex items-center gap-1"><Sun className="h-3 w-3" /> Brightness</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    id="slider-brightness-input"
                    type="range" min={50} max={250} value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span className="flex items-center gap-1"><Contrast className="h-3 w-3" /> Contrast</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    id="slider-contrast-input"
                    type="range" min={50} max={250} value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span>🌈 Saturation</span>
                    <span>{saturation}%</span>
                  </div>
                  <input
                    id="slider-saturation-input"
                    type="range" min={0} max={300} value={saturation}
                    onChange={(e) => setSaturation(parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                {/* Blur */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span>💨 Blur effect</span>
                    <span>{blur}px</span>
                  </div>
                  <input
                    id="slider-blur-input"
                    type="range" min={0} max={15} value={blur}
                    onChange={(e) => setBlur(parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                {/* Sepia */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span>☕ Sepia (Retro)</span>
                    <span>{sepia}%</span>
                  </div>
                  <input
                    id="slider-sepia-input"
                    type="range" min={0} max={100} value={sepia}
                    onChange={(e) => setSepia(parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                {/* GrayScale */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span>🏢 Grayscale (Noir)</span>
                    <span>{grayscale}%</span>
                  </div>
                  <input
                    id="slider-grayscale-input"
                    type="range" min={0} max={100} value={grayscale}
                    onChange={(e) => setGrayscale(parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                {/* Hue Rotate */}
                <div className="md:col-span-2">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span>🎨 Hue Rotation</span>
                    <span>{hueRotate}°</span>
                  </div>
                  <input
                    id="slider-huerot-input"
                    type="range" min={0} max={360} value={hueRotate}
                    onChange={(e) => setHueRotate(parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* TEXT WATERMARK MEME OVERLAYS */}
            <div className="space-y-4 pt-1" id="meme-overlays-section">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-1">
                <Type className="h-3 w-3 text-rose-400" />
                TEXT CAPTION OVERLAYERS
              </h4>

              <div className="space-y-3" id="text-overlays-form">
                <div>
                  <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Top Watermark Text</label>
                  <input
                    id="top-caption-input"
                    type="text"
                    placeholder="E.g. ENTERING GALAXY SECTOR..."
                    value={textTop}
                    onChange={(e) => setTextTop(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Bottom Watermark Text</label>
                  <input
                    id="bottom-caption-input"
                    type="text"
                    placeholder="E.g. MISSION CARRIED OUT SUCCESSFULLY"
                    value={textBottom}
                    onChange={(e) => setTextBottom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-700 focus:outline-none"
                  />
                </div>

                {/* Fonts sizing & coloring */}
                <div className="grid grid-cols-3 gap-3" id="font-style-configs">
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Text Color</label>
                    <input
                      id="text-color-input"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 h-8 rounded-lg outline-none cursor-pointer p-0.5"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Size (px)</label>
                    <input
                      id="text-size-input"
                      type="number"
                      min={12}
                      max={72}
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 h-8 text-[11px] text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Font Family</label>
                    <select
                      id="text-font-family-select"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 h-8 text-[10px] text-slate-200"
                    >
                      <option value="Impact, sans-serif">Impact (Meme)</option>
                      <option value="Arial, sans-serif">Arial Bold</option>
                      <option value="Courier New, monospace">Courier (VHS)</option>
                      <option value="Georgia, serif">Georgia Editorial</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
