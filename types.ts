
export interface RouteOption {
  id: string;
  name: string;
  description: string;
  distanceKm: number;
  durationMin: number;
  trafficLevel: 'Low' | 'Moderate' | 'Heavy';
  tags: string[];
}

export interface TripEstimation {
  id: string; // Unique ID for the trip calculation
  pickup: string;
  dropoff: string;
  routes: RouteOption[];
  recommendedRouteId: string;
  timestamp: number;
}

export interface UserPreferences {
  ratePerKm: number;
  currency: string;
}

export interface AppSettings {
  currency: string;
  ratePerKm: number;
  theme: 'light' | 'dark';
}
