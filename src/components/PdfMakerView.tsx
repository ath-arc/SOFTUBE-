import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Plus, 
  Trash2, 
  RefreshCw, 
  FileDown,
  BookOpen,
  Layers,
  CheckCircle2,
  HardDriveUpload,
  Info,
  Sliders,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  FileDigit,
  Upload
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { DriveNode } from '../types';

interface PdfMakerViewProps {
  currentFolderId: string | null;
  onSaveToDrive: (name: string, content: string, pdfData: any, folderId: string | null) => void;
  selectedDocNode: DriveNode | null;
  onClearSelectedNode: () => void;
}

export default function PdfMakerView({
  currentFolderId,
  onSaveToDrive,
  selectedDocNode,
  onClearSelectedNode
}: PdfMakerViewProps) {
  const [docTitle, setDocTitle] = useState('SOFTDRIVE Business Proposal');
  const [docTheme, setDocTheme] = useState('Technical Clean');
  const [sections, setSections] = useState<{ id: string; heading: string; body: string; image?: string }[]>([
    { 
      id: '1', 
      heading: 'PRODUCER DETAIL', 
      body: 'SOFTDRIVE Software Systems LLC\n102 Silicon Parkway, San Francisco CA\nEmail: accounting@softdrive.net' 
    },
    { 
      id: '2', 
      heading: 'EXECUTIVE PROPOSAL', 
      body: 'Attn: Atharva Mittal Corporate Group\nProject: Distributed Cloud Storage Services Integration\nDate: May 23, 2026' 
    },
    { 
      id: '3', 
      heading: 'SUMMARY OF DELIVERABLES', 
      body: 'We are delivering the unified Cloud Run storage container with integrated tracking shields, high-fidelity Document PDF converter engines, and automated live animation timelines.' 
    }
  ]);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // File Conversion State
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If a document node gets selected from the main drive explorer, load its parameters into Editor!
  useEffect(() => {
    if (selectedDocNode && selectedDocNode.pdfData) {
      setDocTitle(selectedDocNode.pdfData.title);
      setDocTheme(selectedDocNode.pdfData.theme);
      // Ensure section mappings have local ids and optionally load pre-existing images
      const mapped = selectedDocNode.pdfData.sections.map((sec: any, idx: number) => ({
        id: String(idx + 1),
        heading: sec.heading,
        body: sec.body,
        image: sec.image || undefined
      }));
      setSections(mapped);
    }
  }, [selectedDocNode]);

  // Handle Preset quick clicks
  const handleLoadPreset = (presetType: 'invoice' | 'resume' | 'story' | 'pitch') => {
    if (presetType === 'invoice') {
      setDocTitle('Financial Statement: Freelance Invoice');
      setDocTheme('Technical Clean');
      setSections([
        { id: '1', heading: 'CONTRACTOR & CLIENT INFO', body: 'Atharva Mittal Solutions\nFrom: ATHARVA INTEL SYSTEMS CORP\nServices: React/TypeScript Dashboard Construction' },
        { id: '2', heading: 'COMPLETED ITEMS & SERVICE SUMMARY', body: '1. Modular full-stack layout architecture: Completed and reviewed.\n2. Ad blocker simulation sandbox + custom firewall: Armed & running.\n3. Dynamic Live Video engine timeline renderer: Loaded successfully.' },
        { id: '3', heading: 'SETTLEMENT TERMS', body: 'Balance: $4,500.00 USD\nStatus: Pending review\nPayment: Bank transfer or wire exchange.' }
      ]);
    } else if (presetType === 'resume') {
      setDocTitle('Professional Resume: Atharva Mittal');
      setDocTheme('Editorial Warm');
      setSections([
        { id: '1', heading: 'PROFESSIONAL OBJECTIVE', body: 'Innovative Full-Stack Software Architect centered around designing scalable web interfaces, cloud systems, and real-time interactive utilities for AI Studio workflows.' },
        { id: '2', heading: 'CORE TECHNICAL PROFICIENCIES', body: '- Frontend: React 18+, Vite, Tailwind CSS, Motion\n- Backend: Express, Node.js, Tsx, Python\n- AI: Google Gemini GenAI SDK, Vector Integrations' },
        { id: '3', heading: 'REPRESENTATIVE WORK HISTORY', body: 'Engineering Lead @ Softdrive Systems (2024-Present)\n- Built the legendary SOFTDRIVE file manager with visual PDF and Video timeline sandboxes.\n- Optimized DNS proxy metrics to increase payload speed.' }
      ]);
    } else if (presetType === 'pitch') {
      setDocTitle('Executive Pitch Deck Executive Summary');
      setDocTheme('Professional Corporate');
      setSections([
        { id: '1', heading: 'PROBLEM DESCRIPTION', body: 'Users lack local security and unified creative toolboxes. Standard Google Drive fails to integrate active ad-filtering blockers, live subtitle animators, and real PDF editors.' },
        { id: '2', heading: 'SOFTDRIVE RESOLUTION', body: 'Introducing SOFTDRIVE: A highly secured, unified canvas incorporating SOFTShield, CineLive Video Timelines, and PDF document compilers directly inside the disk node tree.' },
        { id: '3', heading: 'MARKET TARGET & GROWTH TRAJECTORY', body: 'Our prototype targets independent developers, creators, and professionals desiring strict sandbox control. Ephemeral local databases minimize security footprints.' }
      ]);
    } else if (presetType === 'story') {
      setDocTitle('Story Outline: Cybernetic Horizon');
      setDocTheme('Creative Neon');
      setSections([
        { id: '1', heading: 'ACT I: THE EMPTY SHELL', body: 'In a neon-drenched metropolis controlled by massive signal towers, an old memory core named Softdrive gets activated. Deep within its storage sectors, it carries a fragmented code of the last public ad-filtering script.' },
        { id: '2', heading: 'ACT II: REARMING THE SHIELD', body: 'A tech-forager named Atharva finds the drive. Hooking it to his terminal, he attempts to arm the filters against tracking bots. Standard security firewalls begin chasing the anomalous code, triggering security sirens.' },
        { id: '3', heading: 'ACT III: SUNSET REBOOT', body: 'The script boots. In a blinding aurora signal pulse, global ads freeze, leaving the skyline clean, revealing the quiet sunset stars behind the tracking nodes.' }
      ]);
    }
  };

  const handleUpdateSection = (id: string, field: 'heading' | 'body', value: string) => {
    setSections(prev => prev.map(sec => sec.id === id ? { ...sec, [field]: value } : sec));
  };

  const handleAddSection = () => {
    const nextId = String(sections.length ? Math.max(...sections.map(s => Number(s.id))) + 1 : 1);
    setSections(prev => [...prev, { id: nextId, heading: `NEW SECTION Heading ${nextId}`, body: 'Enter section content details...' }]);
  };

  const handleRemoveSection = (id: string) => {
    setSections(prev => prev.filter(sec => sec.id !== id));
  };

  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;
    
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...sections];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSections(updated);
  };

  // Section Image Handler (Base64 file reader)
  const handleSectionImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setSections(prev => prev.map(sec => sec.id === id ? { ...sec, image: base64 } : sec));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSectionImage = (id: string) => {
    setSections(prev => prev.map(sec => sec.id === id ? { ...sec, image: undefined } : sec));
  };

  // Automated .docx and .txt Parser Conversion Handler!
  const handleDocumentConversion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConverting(true);
    setConversionStatus(`Parsing document "${file.name}"...`);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let extractedText = '';

      if (fileExtension === 'txt') {
        extractedText = await file.text();
      } else if (fileExtension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = await zip.file("word/document.xml")?.async("string");
        
        if (!docXml) {
          throw new Error("Invalid format. Word/document.xml missing from zip structure.");
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(docXml, "text/xml");
        const paragraphs = xmlDoc.getElementsByTagName("w:p");
        
        const textLines: string[] = [];
        for (let i = 0; i < paragraphs.length; i++) {
          const textElements = paragraphs[i].getElementsByTagName("w:t");
          let line = "";
          for (let j = 0; j < textElements.length; j++) {
            line += textElements[j].textContent;
          }
          if (line.trim()) {
            textLines.push(line.trim());
          }
        }
        extractedText = textLines.join("\n\n");
      } else {
        throw new Error("Unsupported format. Please supply a valid .txt or .docx file.");
      }

      if (!extractedText.trim()) {
        throw new Error("The document appears to be empty.");
      }

      // Convert extracted paragraph chunks into structured PDF Maker sections
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setDocTitle(nameWithoutExt);
      setDocTheme('Technical Clean');

      const textParagraphs = extractedText.split(/\n\n+/).filter(p => p.trim());
      const newSections = textParagraphs.map((para, index) => {
        // Automatically isolate first sentence or line as a heading if reasonable
        let heading = `SECTION ${index + 1}`;
        let body = para;
        const lineBreakIndex = para.indexOf('\n');
        
        if (lineBreakIndex > 0 && lineBreakIndex < 50) {
          heading = para.slice(0, lineBreakIndex).trim().toUpperCase();
          body = para.slice(lineBreakIndex + 1).trim();
        } else if (para.length < 60) {
          heading = para.trim().toUpperCase();
          body = `Detailed brief for ${heading}`;
        }

        return {
          id: String(index + 1),
          heading,
          body
        };
      });

      setSections(newSections.slice(0, 10)); // Restrict to first 10 sections max to fit layout nicely
      setConversionStatus(`Successfully converted "${file.name}"!`);
      setTimeout(() => setConversionStatus(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Document Conversion failed: ' + err.message);
      setConversionStatus(`Conversion error: ${err.message}`);
    } finally {
      setIsConverting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // AI Generation to proxy backend endpoint `/api/gemini/gen-pdf`
  const handleAiDraftPDF = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/gen-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      if (!res.ok) throw new Error('API server failed');
      const data = await res.json();

      if (data.title) setDocTitle(data.title);
      if (data.theme) setDocTheme(data.theme);
      if (data.sections) {
        const parsedSecs = data.sections.map((s: any, i: number) => ({
          id: String(i + 1),
          heading: s.heading || 'Heading',
          body: s.body || ''
        }));
        setSections(parsedSecs);
      }
      setAiPrompt('');
    } catch (err: any) {
      console.error(err);
      alert('Ai Generation issue: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Compile PDF document using jsPDF with full text & images!
  const generateJsPdfBlob = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Theme palette mappings
    const isDark = docTheme === 'Creative Neon';
    const isWarm = docTheme === 'Editorial Warm';
    const isCorp = docTheme === 'Professional Corporate';

    // Background color
    if (isDark) {
      doc.setFillColor(15, 23, 42); // slate 900
      doc.rect(0, 0, 210, 297, 'F');
    } else if (isWarm) {
      doc.setFillColor(252, 251, 247); // warm cream
      doc.rect(0, 0, 210, 297, 'F');
    }

    // Set title font metrics
    doc.setFont("Helvetica", "bold");
    
    // Header styling
    if (isDark) doc.setTextColor(99, 102, 241); // indigo
    else if (isWarm) doc.setTextColor(153, 27, 27); // dark crimson
    else if (isCorp) doc.setTextColor(30, 41, 59); // deep slate
    else doc.setTextColor(59, 130, 246); // technical blue

    doc.setFontSize(22);
    doc.text(docTitle, 15, 25);

    // Subtitle theme annotation
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`SOFTDRIVE document layout context (Theme: ${docTheme})`, 15, 31);
    
    // Decorative separating line
    doc.setDrawColor(226, 232, 240);
    if (isDark) doc.setDrawColor(129, 140, 248);
    doc.line(15, 34, 195, 34);

    let verticalY = 44;

    // Body font variables
    sections.forEach((sec, sIdx) => {
      // Heading text
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      
      if (isDark) doc.setTextColor(129, 140, 248);
      else if (isWarm) doc.setTextColor(220, 38, 38);
      else doc.setTextColor(51, 65, 85);

      // Section label
      doc.text(sec.heading.toUpperCase(), 15, verticalY);
      verticalY += 6;

      // Render image if present
      if (sec.image) {
        try {
          // Add image to PDF dynamically (fits within 180mm width)
          doc.addImage(sec.image, 'JPEG', 15, verticalY, 180, 75);
          verticalY += 82;
        } catch (imgErr) {
          console.warn("Could not draw source image inside jsPDF binary structure: ", imgErr);
        }
      }

      // Section Body details (wrapped lines)
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      if (isDark) doc.setTextColor(203, 213, 225);

      const splitText = doc.splitTextToSize(sec.body, 180);
      
      // Ensure we don't go out of boundaries on tall docs
      splitText.forEach((line: string) => {
        if (verticalY > 280) {
          doc.addPage();
          if (isDark) {
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 297, 'F');
          } else if (isWarm) {
            doc.setFillColor(252, 251, 247);
            doc.rect(0, 0, 210, 297, 'F');
          }
          verticalY = 20;
        }
        doc.text(line, 15, verticalY);
        verticalY += 5.5;
      });

      verticalY += 8; // Padding below sections
    });

    return doc;
  };

  const handleDownloadPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const doc = generateJsPdfBlob();
        doc.save(`${docTitle.toLowerCase().replace(/\s+/g, '_')}_compiled.pdf`);
      } catch (err) {
        console.error(err);
        alert('Could not download PDF natively: ' + err);
      } finally {
        setIsExporting(false);
      }
    }, 400);
  };

  // Convert editor configuration back as a Drive save action
  const handleSaveToSOFTDRIVE = () => {
    const compiledData = {
      title: docTitle,
      theme: docTheme,
      sections: sections.map(s => ({ heading: s.heading, body: s.body, image: s.image || null }))
    };

    // Synthesize simple plain text view representing details
    let summaryText = `# ${docTitle}\n\n`;
    summaryText += `*Generated inside Doc Studio with ${docTheme} style parameters*\n\n`;
    sections.forEach(s => {
      summaryText += `## ${s.heading.toUpperCase()}\n${s.body}\n\n`;
      if (s.image) summaryText += `*[Embedded Image Asset attached to this workspace section]*\n\n`;
    });

    onSaveToDrive(docTitle, summaryText, compiledData, currentFolderId);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 font-sans p-6 text-slate-800" id="draft-dashboard">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4" id="studio-header">
        <div className="flex items-center gap-3" id="studio-badge-row">
          <div className="p-3 bg-red-150 text-red-500 rounded-2xl" id="pdf-icon-badge">
            <Layers className="h-8 w-8 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Document Studio & PDF Maker
              <span className="text-xs py-0.5 px-1.5 bg-red-100 text-red-700 rounded font-bold">ENGINE V2.0</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Construct high-fidelity PDFs from scratch with images, or upload and convert existing `.txt` and `.docx` files directly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" id="studio-header-operations">
          {selectedDocNode && (
            <button
              id="clear-selected-doc-btn"
              onClick={onClearSelectedNode}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Close Loaded File
            </button>
          )}
          
          <button
            id="maker-save-btn"
            onClick={handleSaveToSOFTDRIVE}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
          >
            <HardDriveUpload className="h-3.5 w-3.5 text-indigo-400" />
            <span>Save to SOFTDRIVE</span>
          </button>

          <button
            id="download-doc-btn"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? 'Compiling...' : 'Download Live PDF'}</span>
          </button>
        </div>
      </div>

      {isSavedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-lg mt-4 flex items-center gap-2" id="saved-drive-banner">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Success! Document <strong>"{docTitle}"</strong> has been saved directly to your workspace. Check "SOFTDRIVE" left bar directory to inspect it.</span>
        </div>
      )}

      {/* Main Two-Column Panel: Editor (Left) & PDF Visualizer Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start" id="maker-columns">
        
        {/* Left pane: Forms, Preset triggers & AI helpers (Span 7) */}
        <div className="lg:col-span-6 space-y-6" id="editor-left-pane">
          
          {/* File Converter Upload Zone (.txt and .docx parsing) */}
          <div className="bg-white rounded-xl border border-dashed border-blue-300 bg-blue-50/20 shadow-sm p-4 relative" id="file-converter-dropzone">
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-blue-600" />
              Upload & Convert Existing Document to PDF
            </h3>
            
            <p className="text-[11px] text-slate-500 mb-3 leading-snug">
              Select any Microsoft Word <strong className="text-blue-700">.docx</strong> or raw text <strong className="text-blue-700">.txt</strong> document. We'll automatically build editable PDF subsections from your paragraphs!
            </p>

            <div className="flex items-center gap-3">
              <label 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer flex items-center gap-1.5"
                htmlFor="doc-convert-input"
              >
                <FileDigit className="h-3.5 w-3.5" />
                <span>Choose .txt or .docx file</span>
              </label>
              <input
                id="doc-convert-input"
                type="file"
                ref={fileInputRef}
                accept=".txt,.docx"
                onChange={handleDocumentConversion}
                className="hidden"
              />
              
              {isConverting && (
                <span className="text-xs text-blue-600 font-mono animate-pulse flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> {conversionStatus}
                </span>
              )}

              {!isConverting && conversionStatus && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  ✓ {conversionStatus}
                </span>
              )}
            </div>
          </div>

          {/* AI Brief Generator */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative" id="ai-prompter-box">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-yellow-500 fill-current" />
              Gemini AI-Assistant Writer
            </h3>
            
            <div className="flex gap-2" id="ai-input-group">
              <input
                id="ai-pdf-input"
                type="text"
                placeholder="PROMPT: 'Detailed tech project proposal for dynamic space flight client'..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-lg px-3 py-2 text-xs focus:outline-none placeholder-slate-400"
              />
              <button
                id="ai-pdf-btn"
                onClick={handleAiDraftPDF}
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shrink-0 disabled:bg-slate-200 disabled:text-slate-400 flex items-center gap-1 cursor-pointer"
              >
                {isGenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>{isGenerating ? 'Drafting...' : 'AI Generate'}</span>
              </button>
            </div>
          </div>

          {/* Core file specs inputs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4" id="base-meta-fields">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sliders className="h-3.5 w-3.5 text-blue-500" />
              Document Properties & Layout Theme
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="property-inputs">
              <div id="prop-title">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Document Title</label>
                <input
                  id="doc-title-input"
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div id="prop-theme">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Style Template Palette</label>
                <select
                  id="doc-theme-select"
                  value={docTheme}
                  onChange={(e) => setDocTheme(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg px-3.5 py-1.8 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="Technical Clean">Technical Clean (Familiar light blue accents)</option>
                  <option value="Professional Corporate">Professional Corporate (Slate gray aesthetics)</option>
                  <option value="Creative Neon">Creative Neon (Vibrant slate-900 cyberpunk dark)</option>
                  <option value="Editorial Warm">Editorial Warm (Charming crimson paper text)</option>
                </select>
              </div>
            </div>

            {/* Quick Templates bar */}
            <div className="pt-2" id="preset-row">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Load Local Template Layout Presets:</span>
              <div className="flex flex-wrap gap-1.5" id="presets-choices-container">
                <button
                  id="preset-invoice-btn"
                  onClick={() => handleLoadPreset('invoice')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded transition font-semibold cursor-pointer"
                >
                  📄 Invoice
                </button>
                <button
                  id="preset-resume-btn"
                  onClick={() => handleLoadPreset('resume')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded transition font-semibold cursor-pointer"
                >
                  💼 Resume
                </button>
                <button
                  id="preset-pitch-btn"
                  onClick={() => handleLoadPreset('pitch')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded transition font-semibold cursor-pointer"
                >
                  💡 Pitch deck
                </button>
                <button
                  id="preset-story-btn"
                  onClick={() => handleLoadPreset('story')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded transition font-semibold cursor-pointer"
                >
                  📖 Cyber Story
                </button>
              </div>
            </div>
          </div>

          {/* Sections List builder with custom Image upload options! */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4" id="sections-builder-box">
            <div className="flex items-center justify-between" id="sections-bar-header">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-slate-500" />
                Section Configuration ({sections.length} sectors)
              </h3>
              <button
                id="add-section-btn"
                onClick={handleAddSection}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1" id="sections-editor-container">
              {sections.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs" id="empty-sections-notice">
                  No sections. Tap "Add Section" above or "AI Generate" to populate sections automatically.
                </div>
              ) : (
                sections.map((sec, sIdx) => (
                  <div key={sec.id} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 space-y-3 relative group" id={`section-editor-${sec.id}`}>
                    <div className="flex justify-between items-center" id={`section-action-header-${sec.id}`}>
                      <div className="flex items-center gap-2" id={`section-move-actions-${sec.id}`}>
                        <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded leading-none">
                          Sec {sIdx + 1}
                        </span>
                        
                        {/* Up Down arrows for moving segments */}
                        <button
                          id={`move-up-section-${sec.id}`}
                          onClick={() => handleMoveSection(sIdx, 'up')}
                          disabled={sIdx === 0}
                          className="p-1 hover:bg-slate-200 rounded disabled:opacity-20 cursor-pointer text-slate-600"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`move-down-section-${sec.id}`}
                          onClick={() => handleMoveSection(sIdx, 'down')}
                          disabled={sIdx === sections.length - 1}
                          className="p-1 hover:bg-slate-200 rounded disabled:opacity-20 cursor-pointer text-slate-600"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        id={`delete-section-btn-${sec.id}`}
                        onClick={() => handleRemoveSection(sec.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete Sector"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2.5" id={`section-inputs-${sec.id}`}>
                      <input
                        id={`section-heading-input-${sec.id}`}
                        type="text"
                        placeholder="Section Title / Heading"
                        value={sec.heading}
                        onChange={(e) => handleUpdateSection(sec.id, 'heading', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                      
                      <textarea
                        id={`section-body-textarea-${sec.id}`}
                        rows={3}
                        placeholder="Write detailed section contents..."
                        value={sec.body}
                        onChange={(e) => handleUpdateSection(sec.id, 'body', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-blue-500 leading-relaxed font-sans placeholder-slate-400"
                      />

                      {/* Section Image Selector */}
                      <div className="bg-slate-100/60 p-2.5 rounded-lg border border-slate-200 flex flex-col gap-2" id={`section-image-box-${sec.id}`}>
                        <div className="flex items-center justify-between text-xs text-slate-500" id="label-image-box">
                          <span className="flex items-center gap-1 font-semibold text-[10px] text-slate-500 uppercase tracking-wider">
                            <ImageIcon className="h-3.5 w-3.5 text-indigo-500" />
                            Optional Section Image
                          </span>
                          {sec.image && (
                            <button
                              id={`remove-image-btn-${sec.id}`}
                              type="button"
                              onClick={() => handleRemoveSectionImage(sec.id)}
                              className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-white border border-red-100 hover:bg-red-50 px-2 py-0.5 rounded cursor-pointer"
                            >
                              Remove Image
                            </button>
                          )}
                        </div>

                        {sec.image ? (
                          <div className="relative h-24 w-full rounded border overflow-hidden mt-1 bg-black/5" id={`preview-wrapper-${sec.id}`}>
                            <img 
                              src={sec.image} 
                              alt="Section preview" 
                              className="object-contain w-full h-full"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center" id={`input-wrapper-${sec.id}`}>
                            <label 
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md border border-slate-250 cursor-pointer shadow-xs transition"
                              htmlFor={`img-upload-input-${sec.id}`}
                            >
                              Select JPG/PNG Image
                            </label>
                            <input
                              id={`img-upload-input-${sec.id}`}
                              type="file"
                              accept="image/jpeg,image/png,image/gif"
                              onChange={(e) => handleSectionImageUpload(sec.id, e)}
                              className="hidden"
                            />
                            <span className="text-[10px] text-slate-400 ml-2">Fits automatically on compilation</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right pane: Standard styled Sheet paper Canvas representing live styled preview (Span 5) */}
        <div className="lg:col-span-6 bg-slate-800 rounded-2xl p-6 shadow-xl sticky top-4" id="live-pdf-visualizer">
          <div className="flex items-center justify-between text-slate-300 text-xs font-mono font-semibold mb-4" id="visualizer-header">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 bg-rose-500 rounded-full animate-pulse" />
              WYSIWYG PDF Live Preview (A4 Dimensions)
            </span>
            <span>210mm x 297mm</span>
          </div>

          {/* Interactive Document Sheet Canvas representation */}
          <div 
            className={`w-full max-h-[600px] overflow-y-auto aspect-[1/1.41] shadow-2xl p-8 rounded-lg relative leading-snug break-words transition-all duration-300 ${
              docTheme === 'Creative Neon' ? 'bg-slate-900 text-slate-100 font-sans' :
              docTheme === 'Editorial Warm' ? 'bg-[#FCFBF7] text-amber-950 font-serif' :
              'bg-white text-slate-900 font-sans'
            }`}
            id="pdf-live-sheet"
          >
            {/* Title */}
            <header className="mb-6 border-b pb-4 border-slate-200/50" id="sheet-header">
              <h2 className={`font-bold text-lg tracking-tight ${
                docTheme === 'Creative Neon' ? 'text-indigo-400' :
                docTheme === 'Editorial Warm' ? 'text-red-800' :
                docTheme === 'Professional Corporate' ? 'text-slate-800' : 'text-blue-600'
              }`} id="sheet-title">
                {docTitle || 'Doc Title Placeholder'}
              </h2>
              <span className="text-[9px] font-mono text-slate-450 block mt-1">SOFTDRIVE Document Services • Compile Engine 2.0</span>
            </header>

            {/* Sections display inside paper */}
            <div className="space-y-6" id="sheet-sections-area">
              {sections.length === 0 ? (
                <div className="text-center py-20 text-slate-300 italic text-xs" id="empty-sheet-placeholder">
                  [Empty Sheet Outline - Configure inputs or invoke automated AI blueprints to display content elements]
                </div>
              ) : (
                sections.map((sec, idx) => (
                  <section key={sec.id} className="space-y-2 relative" id={`sheet-section-${sec.id}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${
                      docTheme === 'Creative Neon' ? 'text-indigo-300' :
                      docTheme === 'Editorial Warm' ? 'text-red-700' :
                      'text-blue-600'
                    }`} id={`sheet-heading-${sec.id}`}>
                      {sec.heading || `SECTION HEADING ${idx + 1}`}
                    </h3>

                    {/* Image Preview within WYSIWYG sheet! */}
                    {sec.image && (
                      <div className="w-full my-2.5 h-44 rounded-lg overflow-hidden border border-slate-200/30 bg-slate-100/5 transition">
                        <img 
                          src={sec.image} 
                          alt="Section" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <p className={`text-xs leading-relaxed whitespace-pre-wrap ${
                      docTheme === 'Creative Neon' ? 'text-slate-300' : 'text-slate-600'
                    }`} id={`sheet-body-${sec.id}`}>
                      {sec.body || 'Configure body text metrics...'}
                    </p>
                  </section>
                ))
              )}
            </div>

            {/* Subtle sheet footer */}
            <footer className="mt-12 pt-4 border-t border-slate-100 text-[8px] text-slate-400 font-mono text-center flex justify-between uppercase tracking-wider" id="sheet-footer">
              <span>Secure local print copy</span>
              <span>Page 1 of 1</span>
            </footer>
          </div>

          <div className="mt-4 bg-slate-900/60 p-3.5 border border-slate-700/40 rounded-xl text-xs text-slate-400" id="pdf-maker-tips">
            <span className="font-bold text-slate-300 block mb-1 flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-blue-500" />
              PDF Document Structuring
            </span>
            Loaded templates translate cleanly into formal PDF vectors via client-side print drivers. Add standard custom files inside your dashboard to organize them in designated directories.
          </div>
        </div>

      </div>

    </div>
  );
}
