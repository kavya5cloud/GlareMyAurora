export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  kpIndex: number;
  solarWindSpeed: number; // e.g., 450
  solarWindDensity: number; // e.g., 15
  bz: number; // e.g., -5
  probabilityScore: number; // 0-100
  summary: string;
  visibilityChance: string; // "Low", "Moderate", "High", "Extreme"
  tonightsWindow: string; // e.g., "Best viewing between 23:00 - 02:00"
  nearestDetection?: {
    location: string;
    status: string;
    coordinates?: string; // Optional "lat, long" string
  };
  solarFlare?: {
    class: string; // e.g., "X1.5", "M5.0", "None"
    time: string;
    impact: string; // e.g., "Radio blackout on sunlit side"
    region?: string; // e.g., "AR3664"
    eta?: string; // e.g., "Tomorrow 14:00 UTC" or "N/A"
  };
  forecast: Array<{ time: string; kp: number }>;
  timestamp: string;
  locationName: string;
}

export interface PhotoAnalysis {
  cloudCover: string;
  darknessRating: string; // e.g. "Good (Bortle 4)"
  recommendedSettings: {
    iso: string;
    shutterSpeed: string;
    aperture: string;
    focus: string;
  };
  checklist: string[];
  feedback: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface SearchResult<T> {
  data: T | null;
  rawText: string;
  sources: GroundingSource[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PHOTO_GUIDE = 'PHOTO_GUIDE',
  CHAT = 'CHAT',
}