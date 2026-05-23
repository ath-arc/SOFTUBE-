import { useState, useEffect } from 'react';
import { 
  HardDrive, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Video, 
  Trash2, 
  Star, 
  Clock, 
  Menu,
  ChevronRight,
  Sparkles,
  Info,
  LogOut,
  User,
  ShieldAlert as AlertIcon,
  ChevronLeft
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import DriveView from './components/DriveView';
import AdBlockerView from './components/AdBlockerView';
import PdfMakerView from './components/PdfMakerView';
import VideoMakerView from './components/VideoMakerView';
import PhotoMakerView from './components/PhotoMakerView';
import AuthView from './components/AuthView';
import { DriveNode, AdBlockerStats, AdRule } from './types';

// Error Handler definitions for Firestore
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const DEFAULT_NODES: DriveNode[] = [
  {
    id: 'f-1',
    name: 'Enterprise Contracts',
    type: 'folder',
    parentId: null,
    isStarred: false,
    isTrashed: false,
    size: '0 KB',
    mimeType: 'folder',
    createdAt: '2026-05-23T10:00:00Z'
  },
  {
    id: 'f-2',
    name: 'Cinematic Timelines',
    type: 'folder',
    parentId: null,
    isStarred: true,
    isTrashed: false,
    size: '0 KB',
    mimeType: 'folder',
    createdAt: '2026-05-23T10:01:00Z'
  },
  {
    id: 'd-1',
    name: 'SOFTDRIVE Blueprint Manual',
    type: 'file',
    parentId: null,
    isStarred: true,
    isTrashed: false,
    size: '14.5 KB',
    mimeType: 'text/plain',
    createdAt: '2026-05-23T10:05:00Z',
    content: `SOFTDRIVE PLATFORM SPECIFICATION\n=================================\n\nWelcome to your full-stack local file workspace sandbox.\n\nSOFTDRIVE operates on a secure Express + Vite container framework running Node.js TypeScript. This module combines three distinct workspaces:\n\n1. SOFTShield: Active ad servers and cookies interceptor proxy simulated terminal.\n2. Doc Studio: High-performance PDF builder powered by jsPDF template engines.\n3. CineLive: HTML5 Canvas multi-story active scene animator with synth soundscapes.\n\nEverything is persisted locally using responsive browser state parameters.`
  },
  {
    id: 'p-1',
    name: 'Tech Development Quote',
    type: 'file',
    parentId: 'f-1',
    isStarred: false,
    isTrashed: false,
    size: '42.0 KB',
    mimeType: 'application/pdf',
    createdAt: '2026-05-23T10:08:42Z',
    pdfData: {
      title: 'Dev Project Quote: Atharva Solutions',
      theme: 'Technical Clean',
      sections: [
        { heading: 'CONTRACTOR INVOICE DETAIL', body: 'SOFTDRIVE Solutions Lab LLC\nSan Francisco California\nClient: Atharva Mittal Tech Labs' },
        { heading: 'DELIVERED SOFTWARE MODULES', body: '1. Reactive Sidebar Google Drive Interface Clone\n2. Real-time dynamic ad tracker blocking logs\n3. jsPDF native PDF document compiled and ready\n4. HTML5 canvas animated timelines scene renderer with Web Audio chime' },
        { heading: 'TOTAL BALANCE PAYABLE', body: 'Invoiced Amount: $18,500.00 USD\nPayment Mode: Wire transfer\nDue date: Net 15 days.' }
      ]
    }
  },
  {
    id: 'v-1',
    name: 'Astronaut Deep Space Signal',
    type: 'file',
    parentId: 'f-2',
    isStarred: true,
    isTrashed: false,
    size: '1.2 MB',
    mimeType: 'video/mp4',
    createdAt: '2026-05-23T10:10:00Z',
    videoData: {
      title: 'Deep Space Signal Timeline',
      scenes: [
        {
          id: 'sc-p1',
          title: 'Deep Space Signal Detected',
          subtitle: 'A solitary astronaut drifting past Jupiter scans an anomalous holographic terminal beacon.',
          duration: 5,
          environment: 'cyberpunk',
          particles: 'stars',
          character: 'astronaut',
          movement: 'float'
        },
        {
          id: 'sc-p2',
          title: 'Decryption Shield Processing',
          subtitle: 'Transmitting secure firewall keys into the mainframe matrix binary layers.',
          duration: 4,
          environment: 'matrix',
          particles: 'dust',
          character: 'robot',
          movement: 'pulse'
        },
        {
          id: 'sc-p3',
          title: 'The Sunset Portal Shoreline',
          subtitle: 'The beacon clears, paving a serene path towards the sunset nebula portal.',
          duration: 5,
          environment: 'sunset',
          particles: 'bubbles',
          character: 'bird',
          movement: 'glide'
        }
      ]
    }
  }
];

const DEFAULT_RULES: AdRule[] = [
  { id: '1', domain: 'doubleclick.net', category: 'Ad Server', isActive: true },
  { id: '2', domain: 'google-analytics.com', category: 'Tracker', isActive: true },
  { id: '3', domain: 'telemetry-service.io', category: 'Telemetry', isActive: true },
  { id: '4', domain: 'ads.facebook.net', category: 'Ad Server', isActive: true },
  { id: '5', domain: 'malware-phishing.ws', category: 'Malware', isActive: true }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const [activeTab, setActiveTab] = useState<'drive' | 'blocker' | 'pdf' | 'video' | 'photo'>('drive');
  const [activeCategory, setActiveCategory] = useState<string>('mydrive');
  
  // File Drive nodes
  const [nodes, setNodes] = useState<DriveNode[]>(() => {
    const saved = localStorage.getItem('softdrive_nodes');
    return saved ? JSON.parse(saved) : DEFAULT_NODES;
  });

  // Selected editable nodes from drive selection
  const [selectedPdfNode, setSelectedPdfNode] = useState<DriveNode | null>(null);
  const [selectedVideoNode, setSelectedVideoNode] = useState<DriveNode | null>(null);
  const [selectedPhotoNode, setSelectedPhotoNode] = useState<DriveNode | null>(null);

  // Ad Blocker states
  const [rules, setRules] = useState<AdRule[]>(() => {
    const saved = localStorage.getItem('softdrive_rules');
    return saved ? JSON.parse(saved) : DEFAULT_RULES;
  });

  const [adStats, setAdStats] = useState<AdBlockerStats>(() => {
    return {
      isEnabled: true,
      blockedCount: 142,
      blockedDomains: [
        { domain: 'doubleclick.net', category: 'Ad Server', count: 48 },
        { domain: 'google-analytics.com', category: 'Tracker', count: 62 },
        { domain: 'telemetry-service.io', category: 'Telemetry', count: 32 }
      ],
      history: [
        { id: 'l1', time: '10:15:32 AM', domain: 'doubleclick.net', category: 'Ad Server', action: 'BLOCK' },
        { id: 'l2', time: '10:18:04 AM', domain: 'google-analytics.com', category: 'Tracker', action: 'BLOCK' },
        { id: 'l3', time: '10:20:19 AM', domain: 'telemetry-service.io', category: 'Telemetry', action: 'BLOCK' }
      ]
    };
  });

  // Check state changes of Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsGuestMode(false);
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load and subscribe to cloud nodes for authenticated users
  useEffect(() => {
    if (!currentUser) {
      // Fallback/Guest mode or logged out: load default or localStorage nodes
      const saved = localStorage.getItem('softdrive_nodes');
      setNodes(saved ? JSON.parse(saved) : DEFAULT_NODES);
      return;
    }

    // Subscribe to nodes collection in Firestore
    const userNodesCollection = collection(db, 'users', currentUser.uid, 'nodes');
    
    const unsubscribe = onSnapshot(userNodesCollection, (snapshot) => {
      if (snapshot.empty) {
        // If empty in Firestore, let's pre-populate it with DEFAULT_NODES or localStorage nodes
        const initialNodesStr = localStorage.getItem('softdrive_nodes');
        const initialNodes: DriveNode[] = initialNodesStr ? JSON.parse(initialNodesStr) : DEFAULT_NODES;
        initialNodes.forEach(async (node) => {
          try {
            await setDoc(doc(db, 'users', currentUser!.uid, 'nodes', node.id), node);
          } catch (e) {
            console.error("Error setting initial cloud document: ", e);
          }
        });
        setNodes(initialNodes);
      } else {
        const cloudNodesList: DriveNode[] = [];
        snapshot.forEach((docSnap) => {
          cloudNodesList.push(docSnap.data() as DriveNode);
        });
        setNodes(cloudNodesList);
      }
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}/nodes`);
      } catch (err) {
        console.error("Firestore Permissions standard handling: ", err);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Save to localStorage whenever nodes or rules modify
  useEffect(() => {
    localStorage.setItem('softdrive_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('softdrive_rules', JSON.stringify(rules));
  }, [rules]);

  // Operations: Drive management
  const handleAddFolder = async (name: string, parentId: string | null) => {
    const newFolder: DriveNode = {
      id: 'f-' + Date.now(),
      name,
      type: 'folder',
      parentId,
      isStarred: false,
      isTrashed: false,
      size: '0 KB',
      mimeType: 'folder',
      createdAt: new Date().toISOString()
    };
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'nodes', newFolder.id), newFolder);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/nodes/${newFolder.id}`);
      }
    } else {
      setNodes(prev => [...prev, newFolder]);
    }
  };

  const handleAddFile = async (
    name: string, 
    type: 'text' | 'pdf' | 'video', 
    parentId: string | null, 
    content?: string,
    extraData?: any
  ) => {
    const defaultMimeMap = {
      text: 'text/plain',
      pdf: 'application/pdf',
      video: 'video/mp4'
    };

    const newFileNode: DriveNode = {
      id: 'doc-' + Date.now(),
      name: name.endsWith('.pdf') || name.endsWith('.video') || name.endsWith('.txt') ? name : `${name}.${type === 'text' ? 'txt' : type}`,
      type: 'file',
      parentId,
      isStarred: false,
      isTrashed: false,
      size: extraData?.sizeOverride || '2.4 KB',
      mimeType: extraData?.mimeOverride || defaultMimeMap[type],
      createdAt: new Date().toISOString(),
      content
    };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'nodes', newFileNode.id), newFileNode);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/nodes/${newFileNode.id}`);
      }
    } else {
      setNodes(prev => [...prev, newFileNode]);
    }
  };

  const handleStar = async (id: string) => {
    const targetNode = nodes.find(n => n.id === id);
    if (!targetNode) return;
    const updated = { ...targetNode, isStarred: !targetNode.isStarred };
    
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'nodes', id), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/nodes/${id}`);
      }
    } else {
      setNodes(prev => prev.map(n => n.id === id ? updated : n));
    }
  };

  const handleTrash = async (id: string) => {
    const targetNode = nodes.find(n => n.id === id);
    if (!targetNode) return;
    const updated = { ...targetNode, isTrashed: true };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'nodes', id), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/nodes/${id}`);
      }
    } else {
      setNodes(prev => prev.map(n => n.id === id ? updated : n));
    }
  };

  const handleRestore = async (id: string) => {
    const targetNode = nodes.find(n => n.id === id);
    if (!targetNode) return;
    const updated = { ...targetNode, isTrashed: false };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'nodes', id), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/nodes/${id}`);
      }
    } else {
      setNodes(prev => prev.map(n => n.id === id ? updated : n));
    }
  };

  const handleDeletePermanently = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this file? This action is irreversible.")) {
      if (currentUser) {
        try {
          await deleteDoc(doc(db, 'users', currentUser.uid, 'nodes', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/nodes/${id}`);
        }
      } else {
        setNodes(prev => prev.filter(n => n.id !== id));
      }
    }
  };

  // Click double handler to open and edit files inside Doc Studio / CineLive
  const handleSelectNodeToEdit = (node: DriveNode) => {
    if (node.mimeType.includes('pdf')) {
      setSelectedPdfNode(node);
      setActiveTab('pdf');
    } else if (node.mimeType.includes('video')) {
      setSelectedVideoNode(node);
      setActiveTab('video');
    } else if (node.mimeType.includes('image')) {
      setSelectedPhotoNode(node);
      setActiveTab('photo');
    } else if (node.mimeType === 'text/plain') {
      alert(`Plain Text File:\n\n${node.content}`);
    }
  };

  const handleSavePhotoToDrive = async (
    name: string,
    contentDataUrl: string,
    photoMetadata: any,
    folderId: string | null
  ) => {
    const loadedNodeId = selectedPhotoNode?.id;
    const finalName = name.endsWith('.jpg') ? name : `${name}.jpg`;
    
    if (loadedNodeId) {
      const targetNode = nodes.find(n => n.id === loadedNodeId);
      if (!targetNode) return;
      const updated: DriveNode = {
        ...targetNode,
        name: finalName,
        content: contentDataUrl,
        photoData: photoMetadata,
        createdAt: new Date().toISOString()
      };
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid, 'nodes', loadedNodeId), updated);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/nodes/${loadedNodeId}`);
        }
      } else {
        setNodes(prev => prev.map(node => node.id === loadedNodeId ? updated : node));
      }
    } else {
      const newFileNode: DriveNode = {
        id: 'img-' + Date.now(),
        name: finalName,
        type: 'file',
        parentId: folderId,
        isStarred: false,
        isTrashed: false,
        size: '128.5 KB',
        mimeType: 'image/jpeg',
        createdAt: new Date().toISOString(),
        content: contentDataUrl,
        photoData: photoMetadata
      };
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid, 'nodes', newFileNode.id), newFileNode);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/nodes/${newFileNode.id}`);
        }
      } else {
        setNodes(prev => [...prev, newFileNode]);
      }
    }
  };

  const handleSaveCreatedNodeToDrive = async (
    name: string, 
    contentText: string, 
    appData: any, 
    folderId: string | null
  ) => {
    const isPDF = activeTab === 'pdf';
    const loadedNodeId = isPDF ? selectedPdfNode?.id : selectedVideoNode?.id;
    
    if (loadedNodeId) {
      const targetNode = nodes.find(n => n.id === loadedNodeId);
      if (!targetNode) return;
      const updated: DriveNode = {
        ...targetNode,
        name: name + (isPDF ? '.pdf' : '.video'),
        content: contentText,
        pdfData: isPDF ? appData : undefined,
        videoData: !isPDF ? appData : undefined,
        createdAt: new Date().toISOString()
      };
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid, 'nodes', loadedNodeId), updated);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/nodes/${loadedNodeId}`);
        }
      } else {
        setNodes(prev => prev.map(node => node.id === loadedNodeId ? updated : node));
      }
    } else {
      const cleanName = name.trim();
      const newFileNode: DriveNode = {
        id: (isPDF ? 'pdf-' : 'vid-') + Date.now(),
        name: cleanName + (isPDF ? '.pdf' : '.video'),
        type: 'file',
        parentId: folderId,
        isStarred: false,
        isTrashed: false,
        size: isPDF ? '25.0 KB' : '1.4 MB',
        mimeType: isPDF ? 'application/pdf' : 'video/mp4',
        createdAt: new Date().toISOString(),
        content: contentText,
        pdfData: isPDF ? appData : undefined,
        videoData: !isPDF ? appData : undefined
      };
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid, 'nodes', newFileNode.id), newFileNode);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/nodes/${newFileNode.id}`);
        }
      } else {
        setNodes(prev => [...prev, newFileNode]);
      }
    }
  };

  // Ad blocker stats modifiers
  const handleToggleBlocker = () => {
    setAdStats(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  };

  const handleAddBlockRule = (domain: string, category: AdRule['category']) => {
    const newR: AdRule = {
      id: 'rule-' + Date.now(),
      domain,
      category,
      isActive: true
    };
    setRules(prev => [...prev, newR]);
  };

  const handleRemoveBlockRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsGuestMode(false);
    } catch (err: any) {
      console.error(err);
      alert('Could not sign out: ' + err.message);
    }
  };

  // Loader state rendering
  if (authLoading) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center" id="platform-auth-loader">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs text-slate-400 font-mono">LOADING SECURE SOFTDRIVE MODULES</span>
      </div>
    );
  }

  // Intercept view with Authenticating flows if not logged in & not guest
  if (!currentUser && !isGuestMode) {
    return (
      <AuthView 
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsGuestMode(false);
        }}
        onGuestAccess={() => {
          setIsGuestMode(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-850 font-sans" id="softdrive-root-shell">
      
      {/* LEFT NAVIGATION COLUMN (Unified Sidebar) */}
      {isSidebarVisible && (
        <aside className="w-64 bg-slate-900 border-r border-slate-950 flex flex-col justify-between shrink-0 select-none z-20 text-slate-300 animate-in slide-in-from-left duration-200" id="sidebar-panel">
          
          {/* Upper logo and paths */}
          <div id="sidebar-upper">
            <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between" id="app-logo-area">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('drive'); setActiveCategory('mydrive'); }} id="logo-trigger">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg text-white" id="platform-avatar">
                  S
                </div>
                <div>
                  <span className="font-bold tracking-tight text-base text-white font-sans">SOFTDRIVE</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5" id="sidebar-actions-header">
                {/* Collapse button */}
                <button
                  onClick={() => setIsSidebarVisible(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Hide Sidebar Menu"
                  id="collapse-sidebar-btn"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {/* Live Indicator Shield */}
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded" id="shield-active">
                  SECURE
                </div>
              </div>
            </div>

            <div className="p-4 space-y-6" id="nav-categories">
              {/* Primary Cloud Explorer Section */}
              <div id="cat-explorer">
                <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 font-sans">File Explorer</span>
                <div className="space-y-1" id="nav-links">
                  
                  <button
                    id="tab-drive-my-btn"
                    onClick={() => { setActiveTab('drive'); setActiveCategory('mydrive'); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'drive' && activeCategory === 'mydrive'
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span>📁</span>
                      My Drive
                    </span>
                    <span className="text-[10px] px-1.5 bg-slate-800 text-slate-400 rounded font-mono">{nodes.filter(n => !n.isTrashed && n.parentId === null).length}</span>
                  </button>

                  <button
                    id="tab-drive-starred-btn"
                    onClick={() => { setActiveTab('drive'); setActiveCategory('starred'); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'drive' && activeCategory === 'starred'
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-[#F4B400]">★</span>
                      Starred Elements
                    </span>
                  </button>

                  <button
                    id="tab-drive-recent-btn"
                    onClick={() => { setActiveTab('drive'); setActiveCategory('recent'); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'drive' && activeCategory === 'recent'
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span>🕒</span>
                      Recent Changes
                    </span>
                  </button>

                  <button
                    id="tab-drive-trash-btn"
                    onClick={() => { setActiveTab('drive'); setActiveCategory('trash'); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'drive' && activeCategory === 'trash'
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span>🗑️</span>
                      Trash Vault
                    </span>
                    <span className="text-[10px] px-1.5 bg-rose-950/40 text-rose-400 rounded font-mono">{nodes.filter(n => n.isTrashed).length}</span>
                  </button>

                </div>
              </div>

              {/* Companion Applications/Studios */}
              <div id="cat-studios">
                <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 font-sans">Power Tools</span>
                <div className="space-y-1" id="studios-links">
                  
                  {/* SAFEShield AdBlocker Button */}
                  <button
                    id="tab-blocker-btn"
                    onClick={() => setActiveTab('blocker')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'blocker'
                        ? 'bg-slate-800 text-white border-l-4 border-blue-500 pl-2' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span>🛡️</span>
                      Ad Blocker
                    </span>
                    {adStats.isEnabled ? (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold font-mono">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                        OFFLINE
                      </span>
                    )}
                  </button>

                  {/* PDF Document Studio Button */}
                  <button
                    id="tab-pdf-btn"
                    onClick={() => setActiveTab('pdf')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'pdf'
                        ? 'bg-slate-800 text-white border-l-4 border-blue-500 pl-2' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>📄</span>
                    PDF Maker
                  </button>

                  {/* CineLive Videos Studio Button */}
                  <button
                    id="tab-video-btn"
                    onClick={() => setActiveTab('video')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'video'
                        ? 'bg-slate-800 text-white border-l-4 border-blue-500 pl-2' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>🎬</span>
                    Video Engine
                  </button>

                  {/* AuraShot Photo Studio Button */}
                  <button
                    id="tab-photo-btn"
                    onClick={() => setActiveTab('photo')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'photo'
                        ? 'bg-slate-800 text-white border-l-4 border-blue-500 pl-2' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>📷</span>
                    Photo Maker
                  </button>

                </div>
              </div>
            </div>
          </div>

          {/* User Account & Storage widget at bottom of sidebar */}
          <div className="p-4 space-y-4" id="sidebar-footer">
            <div className="bg-slate-800 p-4 rounded-xl text-left" id="storage-metrics-widget">
              <p className="text-[10px] font-bold text-slate-400 mb-1.5">SOFTDRIVE STORAGE (0.0000001%)</p>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[0.1%]"></div>
              </div>
              <p className="text-[9px] mt-1.5 text-slate-400 font-mono tracking-tight leading-normal">
                4.2 GB of 100000000000000000000000000000000000000000000000⁹ TB used
              </p>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl flex flex-col gap-1 text-left relative" id="avatar-field">
              <div className="flex justify-between items-center" id="avatar-row-inner">
                <span className="text-[9px] text-[#4285F4] font-bold font-mono tracking-wide">SECURE CLOUD</span>
                <button
                  id="sign-out-btn"
                  onClick={handleSignOut}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                  title="Disconnect Cloud Shell"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="text-xs font-bold text-slate-200 tracking-tight block truncate mt-1">
                {currentUser?.email || "Guest Administrator"}
              </span>
            </div>
          </div>

        </aside>
      )}

      {/* RIGHT WORKSPACE BAR */}
      <main className="flex-1 flex flex-col min-h-0 bg-slate-50 relative" id="workspace-main">
        {/* Toggle Sidebar Button when hidden */}
        {!isSidebarVisible && (
          <button
            onClick={() => setIsSidebarVisible(true)}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-750 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all font-bold text-xs tracking-wider uppercase cursor-pointer"
            id="reveal-sidebar-drawer"
            title="Reveal Left Explorer Panel"
          >
            <span>📁 Explore Menu ➡️</span>
          </button>
        )}

        {activeTab === 'drive' && (
          <DriveView
            nodes={nodes}
            onAddFolder={handleAddFolder}
            onAddFile={handleAddFile}
            onStar={handleStar}
            onTrash={handleTrash}
            onRestore={handleRestore}
            onDeletePermanently={handleDeletePermanently}
            onSelectNode={handleSelectNodeToEdit}
            onNavigateToApp={(app) => {
              setSelectedPdfNode(null);
              setSelectedVideoNode(null);
              setSelectedPhotoNode(null);
              setActiveTab(app);
            }}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            blockedCount={adStats.blockedCount}
            isAdBlockerEnabled={adStats.isEnabled}
            onEnableAdBlocker={() => setAdStats(prev => ({ ...prev, isEnabled: true }))}
          />
        )}

        {activeTab === 'blocker' && (
          <AdBlockerView
            stats={adStats}
            onToggleStatus={handleToggleBlocker}
            onAddRule={handleAddBlockRule}
            onRemoveRule={handleRemoveBlockRule}
            rules={rules}
          />
        )}

        {activeTab === 'pdf' && (
          <PdfMakerView
            currentFolderId={null}
            onSaveToDrive={handleSaveCreatedNodeToDrive}
            selectedDocNode={selectedPdfNode}
            onClearSelectedNode={() => setSelectedPdfNode(null)}
          />
        )}

        {activeTab === 'video' && (
          <VideoMakerView
            currentFolderId={null}
            onSaveToDrive={handleSaveCreatedNodeToDrive}
            selectedVideoNode={selectedVideoNode}
            onClearSelectedNode={() => setSelectedVideoNode(null)}
          />
        )}

        {activeTab === 'photo' && (
          <PhotoMakerView
            currentFolderId={null}
            onSaveToDrive={handleSavePhotoToDrive}
            selectedPhotoNode={selectedPhotoNode}
            onClearSelectedNode={() => setSelectedPhotoNode(null)}
          />
        )}
      </main>

    </div>
  );
}
