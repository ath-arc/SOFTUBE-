import { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import { 
  Folder, 
  FileText, 
  Video, 
  Star, 
  Trash2, 
  Search, 
  Plus, 
  ArrowLeft, 
  Share2, 
  Download, 
  Sparkles, 
  Clock, 
  Upload, 
  Eye, 
  Maximize2,
  Trash,
  RotateCcw,
  LucideIcon,
  Info,
  Camera
} from 'lucide-react';
import { DriveNode } from '../types';

interface DriveViewProps {
  nodes: DriveNode[];
  onAddFolder: (name: string, parentId: string | null) => void;
  onAddFile: (name: string, type: 'text' | 'pdf' | 'video', parentId: string | null, content?: string, extraData?: any) => void;
  onStar: (id: string) => void;
  onTrash: (id: string) => void;
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onSelectNode: (node: DriveNode) => void;
  onNavigateToApp: (app: 'pdf' | 'video' | 'blocker' | 'photo') => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  blockedCount?: number;
  isAdBlockerEnabled?: boolean;
  onEnableAdBlocker?: () => void;
}

export default function DriveView({
  nodes,
  onAddFolder,
  onAddFile,
  onStar,
  onTrash,
  onRestore,
  onDeletePermanently,
  onSelectNode,
  onNavigateToApp,
  activeCategory,
  setActiveCategory,
  blockedCount,
  isAdBlockerEnabled = true,
  onEnableAdBlocker
}: DriveViewProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileContent, setUploadedFileContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreviewNode, setSelectedPreviewNode] = useState<DriveNode | null>(null);

  // Filter current folder children or custom categories (Starred, Trash, Recent, etc.)
  const currentNodes = useMemo(() => {
    let list = nodes;

    // First filter by search if present
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return list.filter(n => n.name.toLowerCase().includes(query) && !n.isTrashed);
    }

    // Category overrides
    if (activeCategory === 'starred') {
      return list.filter(n => n.isStarred && !n.isTrashed);
    } else if (activeCategory === 'trash') {
      return list.filter(n => n.isTrashed);
    } else if (activeCategory === 'recent') {
      // Sort by creation date descending
      return [...list].filter(n => !n.isTrashed).sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
    }

    // Default: filter by folder structure
    return list.filter(n => n.parentId === currentFolderId && !n.isTrashed);
  }, [nodes, currentFolderId, searchQuery, activeCategory]);

  // Compute breadcrumbs path
  const breadcrumbs = useMemo(() => {
    if (!currentFolderId) return [];
    const crumbs = [];
    let current = nodes.find(n => n.id === currentFolderId);
    while (current) {
      crumbs.unshift(current);
      current = current.parentId ? nodes.find(n => n.id === current.parentId) : undefined;
    }
    return crumbs;
  }, [nodes, currentFolderId]);

  const handleFolderClick = (node: DriveNode) => {
    if (node.type === 'folder') {
      setCurrentFolderId(node.id);
      setActiveCategory('mydrive');
      setSearchQuery('');
    } else {
      setSelectedPreviewNode(node);
    }
  };

  const handleCreateFolderSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim(), currentFolderId);
      setNewFolderName('');
      setIsCreatingFolder(false);
      setIsNewMenuOpen(false);
    }
  };

  const handleLocalUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    const isImg = file.type.startsWith('image/') || file.name.match(/\.(png|jpe?g|gif|svg|webp)$/i);

    reader.onload = (event) => {
      const content = event.target?.result as string || '';
      
      // Determine node type based on mime
      let detectedType: 'text' | 'pdf' | 'video' = 'text';
      if (file.type.includes('pdf')) {
        detectedType = 'pdf';
      } else if (file.type.includes('mp4') || file.type.includes('video')) {
        detectedType = 'video';
      }

      const sizeStr = (file.size / 1024) > 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

      onAddFile(file.name, detectedType, currentFolderId, content, {
        sizeOverride: sizeStr,
        mimeOverride: file.type
      });

      setIsUploading(false);
      setIsNewMenuOpen(false);
    };

    if (isImg || file.type.includes('pdf') || file.type.includes('video')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Helper file icon renderer
  const getFileIcon = (mimeType: string): LucideIcon => {
    if (mimeType === 'folder') return Folder;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('video') || mimeType.includes('mp4')) return Video;
    if (mimeType.includes('image') || mimeType.includes('jpeg') || mimeType.includes('png')) return Camera;
    return FileText;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 font-sans" id="drive-root">
      {/* Top action/search bar */}
      <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white z-10 shrink-0" id="drive-header">
        <div className="flex items-center gap-3 w-1/3" id="search-box">
          <div className="relative w-full max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              id="search-input"
              type="text"
              placeholder="Search your SoftDrive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100 rounded-lg text-xs border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all duration-150"
            />
          </div>
        </div>

        <div className="flex items-center gap-4" id="quick-links">
          {/* Ad-Shield Tracker Badge */}
          <div 
            onClick={() => onNavigateToApp('blocker')}
            className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider hover:bg-emerald-100 cursor-pointer transition-colors"
            id="header-adshield-badge"
          >
            <span>🛡️</span>
            <span>{blockedCount !== undefined ? blockedCount.toLocaleString() : "1,242"} ADS BLOCKED TODAY</span>
          </div>

          {/* Quick Create PDF Button */}
          <button 
            id="quick-pdf-btn"
            onClick={() => onNavigateToApp('pdf')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold tracking-tight transition-colors border border-slate-250 cursor-pointer"
          >
            <span>📄</span>
            <span>PDF Maker</span>
          </button>
          
          {/* Quick Create Video Button */}
          <button 
            id="quick-video-btn"
            onClick={() => onNavigateToApp('video')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold tracking-tight transition-colors cursor-pointer"
          >
            <span>🎬</span>
            <span>Video Engine</span>
          </button>

          {/* Quick Create Photo Button */}
          <button 
            id="quick-photo-btn"
            onClick={() => onNavigateToApp('photo')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold tracking-tight transition-colors cursor-pointer"
          >
            <span>📷</span>
            <span>Photo Maker</span>
          </button>

          {/* User profile bubble */}
          <div className="w-8 h-8 rounded-full bg-orange-150 border border-orange-250 flex items-center justify-center text-orange-700 font-bold text-xs shadow-sm select-none" id="user-profile-bubble">
            JS
          </div>
        </div>
      </header>

      {/* Main interface body */}
      <div className="flex-1 flex min-h-0 relative" id="drive-body-container">
        {/* Workspace Canvas Area */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto" id="workspace-canvas">
          {/* File explorer path breadcrumbs */}
          <div className="flex items-center justify-between mb-6" id="breadcrumbs-bar">
            <div className="flex items-center gap-1 text-sm text-slate-500 font-medium" id="path-list">
              <button 
                id="root-crumbs-btn"
                onClick={() => { setCurrentFolderId(null); setActiveCategory('mydrive'); }} 
                className="hover:text-slate-800 hover:underline transition-colors cursor-pointer"
              >
                SOFTDRIVE
              </button>
              
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id} className="flex items-center gap-1" id={`crumb-node-${crumb.id}`}>
                  <span>/</span>
                  <button 
                    id={`crumb-btn-${crumb.id}`}
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className={`hover:text-slate-800 hover:underline transition-colors font-semibold ${
                      idx === breadcrumbs.length - 1 ? 'text-slate-900 border-b border-indigo-400' : ''
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}

              {activeCategory === 'starred' && <span className="text-[#F4B400] font-semibold flex items-center gap-1 ml-1"><Star className="h-4 w-4 fill-current"/> Starred Vault</span>}
              {activeCategory === 'trash' && <span className="text-rose-500 font-semibold flex items-center gap-1 ml-1"><Trash2 className="h-4 w-4"/> Trash Archive</span>}
              {activeCategory === 'recent' && <span className="text-slate-700 font-semibold flex items-center gap-1 ml-1"><Clock className="h-4 w-4"/> Recent Modifications</span>}
            </div>

            {/* "New" Dropdown menu */}
            {activeCategory !== 'trash' && (
              <div className="relative" id="new-dropdown-wrapper">
                <button
                  id="new-item-btn"
                  onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#4285F4] hover:bg-[#357AE8] text-white font-medium rounded-lg shadow-sm hover:shadow text-sm transition-all duration-150"
                >
                  <Plus className="h-4 w-4 stroke-[3px]" />
                  <span>Create New</span>
                </button>

                {isNewMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsNewMenuOpen(false)} id="new-menu-overlay" />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 divide-y divide-slate-100" id="new-menu-choices">
                      <div className="py-1">
                        <button
                          id="choice-folder-btn"
                          onClick={() => { setIsCreatingFolder(true); setIsNewMenuOpen(false); }}
                          className="w-full px-4 py-2 hover:bg-slate-50 text-left text-sm text-slate-700 flex items-center gap-3 active:bg-slate-100"
                        >
                          <Folder className="h-4 w-4 text-blue-500" />
                          <span>New Folder</span>
                        </button>
                      </div>
                      <div className="py-1">
                        <button
                          id="choice-pdf-btn"
                          onClick={() => { onNavigateToApp('pdf'); setIsNewMenuOpen(false); }}
                          className="w-full px-4 py-2 hover:bg-slate-50 text-left text-sm text-slate-700 flex items-center gap-3"
                        >
                          <FileText className="h-4 w-4 text-red-500" />
                          <span>PDF Document Studio</span>
                        </button>
                        <button
                          id="choice-video-btn"
                          onClick={() => { onNavigateToApp('video'); setIsNewMenuOpen(false); }}
                          className="w-full px-4 py-2 hover:bg-slate-50 text-left text-sm text-slate-700 flex items-center gap-3"
                        >
                          <Video className="h-4 w-4 text-emerald-500" />
                          <span>Live Video Storyboard</span>
                        </button>
                        <button
                          id="choice-photo-btn"
                          onClick={() => { onNavigateToApp('photo'); setIsNewMenuOpen(false); }}
                          className="w-full px-4 py-2 hover:bg-slate-50 text-left text-sm text-slate-700 flex items-center gap-3"
                        >
                          <Camera className="h-4 w-4 text-rose-500" />
                          <span>Photo Maker Studio</span>
                        </button>
                      </div>
                      <div className="py-1">
                        <label className="w-full px-4 py-2 hover:bg-slate-50 text-left text-sm text-slate-700 flex items-center gap-3 cursor-pointer">
                          <Upload className="h-4 w-4 text-violet-500" />
                          <span>Upload Mock File</span>
                          <input type="file" onChange={handleLocalUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Create Folder Inline Form Modal */}
          {isCreatingFolder && (
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 mb-6 max-w-sm transition-all duration-200" id="new-folder-form">
              <form onSubmit={handleCreateFolderSubmit} className="flex gap-2">
                <input
                  id="folder-name-input"
                  type="text"
                  placeholder="Enter folder name..."
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <button type="submit" className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" id="submit-folder-btn">Create</button>
                <button type="button" onClick={() => setIsCreatingFolder(false)} className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200">Cancel</button>
              </form>
            </div>
          )}

          {/* Quick Launch App Shortcuts Deck */}
          {activeCategory === 'mydrive' && !currentFolderId && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" id="quick-launchers-deck">
              <div 
                onClick={() => onNavigateToApp('pdf')} 
                className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 hover:border-blue-500 hover:shadow-sm cursor-pointer transition-all duration-150 group"
                id="launcher-pdf-card"
              >
                <div className="w-11 h-11 bg-red-50 text-red-600 rounded-lg flex items-center justify-center text-lg font-bold">
                  📄
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">PDF Creator</h3>
                  <p className="text-[10px] text-slate-500">Draft, Sign, Compile</p>
                </div>
              </div>

              <div 
                onClick={() => onNavigateToApp('video')} 
                className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 hover:border-blue-500 hover:shadow-sm cursor-pointer transition-all duration-150 group"
                id="launcher-video-card"
              >
                <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center text-lg font-bold">
                  🎬
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Video Engine</h3>
                  <p className="text-[10px] text-slate-500">Live Custom Storyboards</p>
                </div>
              </div>

              <div 
                onClick={() => onNavigateToApp('photo')} 
                className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 hover:border-blue-500 hover:shadow-sm cursor-pointer transition-all duration-150 group"
                id="launcher-photo-card"
              >
                <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center text-lg font-bold">
                  📷
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Photo Studio</h3>
                  <p className="text-[10px] text-slate-500">Filters & Watermarks</p>
                </div>
              </div>

              <div 
                onClick={() => onNavigateToApp('blocker')} 
                className="bg-slate-900 border border-slate-950 p-4 rounded-xl flex items-center gap-4 text-white hover:bg-slate-850 cursor-pointer transition-all duration-150 group"
                id="launcher-blocker-card"
              >
                <div className="w-11 h-11 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-lg font-bold">
                  🛡️
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">SoftShield active</h3>
                  <p className="text-[10px] text-slate-400">Live Traffic & Logs Monitor</p>
                </div>
              </div>
            </div>
          )}

          {/* Directory Content List Header */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2" id="recent-files-list-header">
            <h2 className="font-bold text-[11px] text-slate-500 uppercase tracking-widest">
              {activeCategory === 'starred' ? '★ STARRED ELEMENTS' :
               activeCategory === 'trash' ? '🗑️ TRASH ARCHIVE' :
               activeCategory === 'recent' ? '🕒 RECENT ALTERATIONS' : '📁 DIRECTORIES & WORKSPACE FILES'} ({currentNodes.length})
            </h2>
          </div>

          {/* Drive Directory List */}
          {!isAdBlockerEnabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-805" id="sponsored-feed-ad">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔥</span>
                <div>
                  <p className="font-bold text-amber-900">SPONSORED: Cloud Storage Accelerator Premium Pro</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">Upgrade your account to 5000GB and bypass queue limits instantly. Only $0.99!</p>
                </div>
              </div>
              <button
                _id="block-sponsored-ads-header-btn"
                onClick={onEnableAdBlocker}
                className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-650 text-white font-bold rounded-lg text-[10px] tracking-wider uppercase shrink-0 transition-colors cursor-pointer"
              >
                🛑 Block Ads with SoftShield
              </button>
            </div>
          )}

          {currentNodes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center" id="empty-state">
              <span className="text-4xl mb-3">📂</span>
              <h3 className="text-sm font-bold text-slate-800">No content here</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {activeCategory === 'trash' ? "Your trash folder is sparkling clean." : "Upload custom assets or tap 'Create New' to build custom elements immediately."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="files-grid">
              {!isAdBlockerEnabled && (
                <div className="border border-red-200 bg-red-50/20 rounded-xl p-4 flex flex-col justify-between h-48 text-xs relative overflow-hidden" id="sponsored-grid-card">
                  <div className="absolute top-2 right-2 bg-red-100 text-red-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Sponsored Ad
                  </div>
                  <div>
                    <span className="text-2xl">💰</span>
                    <h4 className="font-bold text-slate-800 mt-2">Win a custom Apple iPhone 15 Pro!</h4>
                    <p className="text-slate-500 text-[10px] mt-1 leading-snug">Congratulations SoftDrive user! You have been randomly selected. Spin the rewards wheel now!</p>
                  </div>
                  <button
                    onClick={onEnableAdBlocker}
                    className="w-full text-center py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                    id="grid-block-ads-btn"
                  >
                    Remove Spoilers with Shield
                  </button>
                </div>
              )}

              {currentNodes.map((node) => {
                const NodeIcon = getFileIcon(node.mimeType);
                const isVideo = node.mimeType.includes('video') || node.name.endsWith('.video');
                const isPdf = node.mimeType.includes('pdf') || node.name.endsWith('.pdf');
                const isImage = node.mimeType.startsWith('image/') || node.name.match(/\.(png|jpe?g|gif|svg|webp)$/i) || node.mimeType.includes('image');
                const isFolder = node.type === 'folder';

                return (
                  <div
                    id={`file-card-${node.id}`}
                    key={node.id}
                    className="group bg-white border border-slate-200 hover:border-blue-500 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow transition-all duration-150 relative"
                  >
                    {/* High Density Premium Thumbnail top header container */}
                    <div 
                      onClick={() => handleFolderClick(node)}
                      className={`h-24 flex items-center justify-center relative cursor-pointer overflow-hidden transition-all duration-150 select-none ${
                        isFolder ? 'bg-blue-50/50 hover:bg-blue-50' :
                        isPdf ? 'bg-rose-50/40 hover:bg-rose-50/60' :
                        isVideo ? 'bg-slate-905 bg-indigo-950/90 hover:bg-indigo-900/90' :
                        isImage ? 'bg-slate-100 hover:bg-slate-150' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                      id={`thumbnail-${node.id}`}
                    >
                      {/* Render full base64 images direct preview if image */}
                      {isImage && node.content && node.content.startsWith('data:') ? (
                        <img 
                          src={node.content} 
                          alt={node.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <>
                          {/* Live indicators / Special labels for high density feel */}
                          {isVideo && (
                            <>
                              <span className="absolute top-2 left-2 bg-indigo-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                LIVE SCENE
                              </span>
                              <span className="absolute bottom-2 right-2 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            </>
                          )}

                          {isPdf && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                              PDF DOC
                            </span>
                          )}

                          {isFolder && (
                            <span className="absolute top-2 left-2 bg-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              DIRECTORY
                            </span>
                          )}

                          {/* Display beautiful layered design inside the visual block */}
                          <div className="flex flex-col items-center justify-center gap-1.5" id={`visual-badge-${node.id}`}>
                            <span className="text-3xl filter drop-shadow font-sans">
                              {isFolder ? '📂' : isPdf ? '📕' : isVideo ? '🎬' : isImage ? '🖼️' : '📄'}
                            </span>
                            {isVideo && (
                              <span className="text-[9px] font-mono font-bold text-indigo-200 tracking-wider">
                                {node.videoData?.scenes?.length || 3} SCENES
                              </span>
                            )}
                            {isPdf && (
                              <span className="text-[9px] font-mono font-bold text-red-600 tracking-wider">
                                {node.pdfData?.sections?.length || 2} SECS
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Metadata summary & operational button actions block below */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between" id={`meta-panel-${node.id}`}>
                      <div className="cursor-pointer" onClick={() => handleFolderClick(node)} id={`info-${node.id}`}>
                        <h4 className="text-xs font-bold text-slate-800 truncate leading-snug group-hover:text-blue-600 transition-colors" title={node.name}>
                          {node.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                          <span>{isFolder ? 'Folder' : node.size}</span>
                          <span>{node.createdAt.split('T')[0]}</span>
                        </p>
                      </div>

                      {/* Divider and actionable operations row */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between" id={`actions-${node.id}`}>
                        <div className="flex gap-1" id={`star-restore-wrapper-${node.id}`}>
                          {!node.isTrashed ? (
                            <button
                              id={`star-btn-${node.id}`}
                              onClick={() => onStar(node.id)}
                              className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                                node.isStarred ? 'text-[#F4B400] hover:text-[#DDA000]' : 'text-slate-350 hover:text-slate-400'
                              }`}
                              title={node.isStarred ? 'Starred' : 'Star file'}
                            >
                              <Star className={`h-3.5 w-3.5 ${node.isStarred ? 'fill-current' : ''}`} />
                            </button>
                          ) : (
                            <button
                              id={`restore-btn-${node.id}`}
                              onClick={() => onRestore(node.id)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors text-[10px] flex items-center gap-1 font-bold"
                              title="Restore from Trash"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Restore</span>
                            </button>
                          )}

                          {/* Direct App editor launching trigger action */}
                          {node.type === 'file' && !node.isTrashed && (
                            <button
                              id={`preview-action-btn-${node.id}`}
                              onClick={() => onSelectNode(node)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="Edit in Workspace"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* File Trashing & Purging actions */}
                        {!node.isTrashed ? (
                          <button
                            id={`trash-btn-${node.id}`}
                            onClick={() => onTrash(node.id)}
                            className="p-1 text-slate-350 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                            title="Move to Trash"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            id={`delete-perm-btn-${node.id}`}
                            onClick={() => onDeletePermanently(node.id)}
                            className="p-1 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors text-[10px] font-bold flex items-center gap-0.5"
                            title="Delete Permanently"
                          >
                            <Trash className="h-3 w-3" />
                            <span>Purge</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Ad-Shield Active Bar */}
          <div className="mt-auto pt-8" id="bottom-ad-shield-spacer">
            {isAdBlockerEnabled ? (
              <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-xl flex items-center justify-between" id="bottom-ad-shield-bar">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold select-none">✓</div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800">SoftDrive Ad-Shield is active</p>
                    <p className="text-[10px] text-emerald-600">Your experience is clean and secure from trackers.</p>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigateToApp('blocker')} 
                  className="text-[10px] font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-md border border-emerald-200 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  VIEW REPORT
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between" id="bottom-ad-shield-bar-off">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold select-none">!</div>
                  <div>
                    <p className="text-xs font-bold text-amber-800">DNS Threat Firewall is Disabled</p>
                    <p className="text-[10px] text-amber-600">Sponsored advertisements are allowed in workspace views.</p>
                  </div>
                </div>
                <button 
                  onClick={onEnableAdBlocker} 
                  className="text-[10px] font-bold text-indigo-700 bg-white px-3 py-1.5 rounded-md border border-indigo-200 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  ARM FILTER
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Selected Preview Panel / Inspect Drawer (Google Drive style on the right side) */}
        {selectedPreviewNode && (() => {
          const isDocImage = selectedPreviewNode.mimeType.startsWith('image/') || selectedPreviewNode.name.match(/\.(png|jpe?g|gif|svg|webp)$/i);
          return (
            <div className="w-80 border-l border-slate-200 bg-white flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-200" id="preview-panel">
              <div className="flex items-center justify-between mb-6" id="panel-header">
                <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1">
                  <Info className="h-4 w-4 text-[#4285F4]" />
                  File Details
                </h3>
                <button 
                  id="close-panel-btn"
                  onClick={() => setSelectedPreviewNode(null)} 
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>

              {/* Icon & Title */}
              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100" id="panel-logo">
                <div className={`p-4 rounded-xl mb-3 ${
                  selectedPreviewNode.type === 'folder' ? 'bg-blue-50 text-[#4285F4]' :
                  selectedPreviewNode.mimeType.includes('pdf') ? 'bg-rose-50 text-rose-500' :
                  selectedPreviewNode.mimeType.includes('video') ? 'bg-emerald-50 text-emerald-500' : 
                  isDocImage ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-600'
                }`} id="panel-icon-box">
                  {selectedPreviewNode.type === 'folder' ? <Folder className="h-10 w-10" /> :
                   selectedPreviewNode.mimeType.includes('pdf') ? <FileText className="h-10 w-10" /> : 
                   selectedPreviewNode.mimeType.includes('video') ? <Video className="h-10 w-10" /> :
                   isDocImage ? <Camera className="h-10 w-10" /> : <FileText className="h-10 w-10" />}
                </div>
                <h4 className="font-bold text-slate-800 text-sm break-all leading-tight px-2" id="panel-title">{selectedPreviewNode.name}</h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">{selectedPreviewNode.size}</p>
              </div>

              {/* Metadata Fields */}
              <div className="py-6 space-y-4 border-b border-slate-100 text-xs text-slate-600" id="panel-meta">
                <div className="flex justify-between" id="field-type">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">Type</span>
                  <span className="font-mono">{selectedPreviewNode.mimeType}</span>
                </div>
                <div className="flex justify-between" id="field-created">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">Created At</span>
                  <span className="font-mono">{selectedPreviewNode.createdAt.replace('T', ' ').slice(0, 19)}</span>
                </div>
                <div className="flex justify-between" id="field-starred">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">Starred</span>
                  <span className="font-semibold text-[#F4B400]">{selectedPreviewNode.isStarred ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {/* Quick Preview Content / Actions */}
              <div className="pt-6 space-y-4" id="panel-content-actions">
                {selectedPreviewNode.content && (
                  <div className="text-xs" id="preview-text-block">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-2">Content Preview</span>
                    {isDocImage && selectedPreviewNode.content.startsWith('data:') ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-50 flex items-center justify-center p-2">
                        <img 
                          src={selectedPreviewNode.content} 
                          alt="Preview" 
                          className="max-h-48 object-contain rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-3 rounded-lg font-mono text-slate-700 max-h-36 overflow-y-auto border border-slate-100 whitespace-pre-wrap leading-relaxed animate-in fade-in duration-200">
                        {selectedPreviewNode.content}
                      </div>
                    )}
                  </div>
                )}

                {selectedPreviewNode.pdfData && (
                  <div className="bg-red-50/50 border border-red-100 p-3 rounded-lg text-xs" id="pdf-panel-details">
                    <span className="font-bold text-red-700 block mb-1">Formatted PDF Studio Doc</span>
                    <p className="text-red-600 leading-tight">Theme: {selectedPreviewNode.pdfData.theme}</p>
                    <p className="text-slate-500 mt-1">{selectedPreviewNode.pdfData.sections.length} fully drafted sections.</p>
                  </div>
                )}

                {selectedPreviewNode.videoData && (
                  <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg text-xs" id="video-panel-details">
                    <span className="font-bold text-emerald-700 block mb-1">Live Scene Sequence</span>
                    <p className="text-emerald-600 leading-tight">Scene count: {selectedPreviewNode.videoData.scenes.length}</p>
                    <p className="text-slate-500 mt-1">Ready to animate in CineLive Studio.</p>
                  </div>
                )}

                {selectedPreviewNode.photoData && (
                  <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-lg text-xs" id="photo-panel-details">
                    <span className="font-bold text-rose-700 block mb-1">AuraShot Edited Photo</span>
                    <p className="text-rose-600 leading-tight">Frame Accent: {selectedPreviewNode.photoData.activeFrame || 'none'}</p>
                    <p className="text-slate-500 mt-1">Captions: "{selectedPreviewNode.photoData.textTop || 'None'}" / "{selectedPreviewNode.photoData.textBottom || 'None'}"</p>
                  </div>
                )}

                {selectedPreviewNode.type === 'file' && !isDocImage && (
                  <button
                    id="panel-edit-jump-btn"
                    onClick={() => {
                      onSelectNode(selectedPreviewNode);
                      setSelectedPreviewNode(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition-colors"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Open in App Canvas</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
