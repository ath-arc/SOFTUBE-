export interface DriveNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  isStarred: boolean;
  isTrashed: boolean;
  size: string;
  mimeType: string;
  createdAt: string;
  content?: string; // Standard text content or raw structured strings
  pdfData?: {
    title: string;
    theme: string;
    sections: { heading: string; body: string }[];
  };
  videoData?: {
    title: string;
    scenes: VideoScene[];
  };
  photoData?: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    grayscale: number;
    sepia: number;
    hueRotate: number;
    activeFrame: string;
    textTop: string;
    textBottom: string;
    textColor: string;
    fontSize: number;
    fontFamily: string;
  };
}

export interface VideoScene {
  id: string;
  title: string;
  subtitle: string;
  duration: number; // in seconds
  environment: 'cyberpunk' | 'serene' | 'sunset' | 'matrix' | 'aurora';
  particles: 'none' | 'snow' | 'stars' | 'bubbles' | 'dust';
  character: 'none' | 'robot' | 'astronaut' | 'ninja' | 'bird';
  movement: 'steady' | 'float' | 'glide' | 'pulse' | 'spin';
}

export interface AdBlockerStats {
  isEnabled: boolean;
  blockedCount: number;
  blockedDomains: { domain: string; category: string; count: number }[];
  history: { id: string; time: string; domain: string; category: string; action: string }[];
}

export interface AdRule {
  id: string;
  domain: string;
  category: 'Ad Server' | 'Tracker' | 'Telemetry' | 'Malware' | 'Social Pixel';
  isActive: boolean;
}
