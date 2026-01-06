import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { MapVisualization } from './components/MapVisualization';
import { HistoryModal } from './components/HistoryModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SettingsModal } from './components/SettingsModal';
import { TripEstimation, AppSettings } from './types';
import { GOOGLE_MAPS_API_KEY } from './config';

// Default coordinates for the initial demo locations (Minna, Nigeria)
const DEFAULT_PICKUP_COORDS = { lat: 9.6160, lng: 6.5540 }; // Tunga
const DEFAULT_DROPOFF_COORDS = { lat: 9.6450, lng: 6.5300 }; // Bosso

// Extend window interface for Google Maps Auth Failure handler
declare global {
  interface Window {
    gm_authFailure?: () => void;
    google: any;
  }
}

function App() {
  // Application State
  const [pickup, setPickup] = useState('Tunga');
  const [dropoff, setDropoff] = useState('Bosso');
  
  // Coordinate State for Robust Mapping
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(DEFAULT_PICKUP_COORDS);
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lng: number} | null>(DEFAULT_DROPOFF_COORDS);
  
  const [addBuffer, setAddBuffer] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('mas_drive_settings');
    return saved ? JSON.parse(saved) : {
      currency: '₦',
      ratePerKm: 500,
      theme: 'light'
    };
  });

  const [tripData, setTripData] = useState<TripEstimation | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  
  // History State with Persistence
  const [history, setHistory] = useState<TripEstimation[]>(() => {
      const saved = localStorage.getItem('mas_drive_history');
      return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Map API State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Theme Effect
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mas_drive_settings', JSON.stringify(settings));
  }, [settings]);

  // History Persistence Effect
  useEffect(() => {
      localStorage.setItem('mas_drive_history', JSON.stringify(history));
  }, [history]);

  // Load API Key
  useEffect(() => {
    // 1. Priority: Use Config Key if available (Guarantees functionality)
    if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 5) {
      loadGoogleMaps(GOOGLE_MAPS_API_KEY);
      return;
    }

    // 2. Fallback: Check Local Storage
    const storedKey = localStorage.getItem('google_maps_api_key');
    if (storedKey && storedKey.length > 5) {
      loadGoogleMaps(storedKey);
      return;
    }
  }, []);

  const loadGoogleMaps = (key: string) => {
    if (window.google && window.google.maps) {
      setIsMapLoaded(true);
      setApiKey(key);
      return;
    }

    if (document.getElementById('google-maps-script')) {
        setIsMapLoaded(true);
        setApiKey(key);
        return;
    }

    window.gm_authFailure = () => {
        console.error("Google Maps Authentication Failure detected.");
        // We do not clear the API key here immediately to avoid flickering loop,
        // but we show a toast.
        showToast("Map Authentication Failed. Check API Key restrictions.");
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsMapLoaded(true);
      setApiKey(key);
    };
    script.onerror = () => {
      showToast("Network Error: Could not load Maps");
      setApiKey(null);
    };
    document.head.appendChild(script);
  };

  const handleTripGenerated = (data: TripEstimation) => {
    setTripData(data);
    setSelectedRouteId(data.recommendedRouteId);
    
    setHistory(prev => {
        const isDuplicate = prev.some(item => item.id === data.id);
        if (isDuplicate) return prev;
        return [data, ...prev].slice(0, 10);
    });
  };

  const handleRouteSelected = (routeId: string) => {
      setSelectedRouteId(routeId);
  }

  const handleHistorySelect = (trip: TripEstimation) => {
      setTripData(trip);
      setPickup(trip.pickup);
      setDropoff(trip.dropoff);
      setPickupCoords(null);
      setDropoffCoords(null);
      
      setSelectedRouteId(trip.recommendedRouteId);
      setShowHistory(false);
      setAddBuffer(false);
  }

  const handleDashboardClick = () => {
    setTripData(null);
    setSelectedRouteId(null);
    setPickup('');
    setDropoff('');
    setPickupCoords(null);
    setDropoffCoords(null);
    setAddBuffer(false);
    showToast("Dashboard Reset");
  };

  const handleLocationFound = () => {
    if (navigator.geolocation) {
       showToast("Locating you...");
       navigator.geolocation.getCurrentPosition(async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coords = { lat, lng };
          
          setPickupCoords(coords);

          if (window.google && window.google.maps && window.google.maps.Geocoder) {
            try {
                const geocoder = new window.google.maps.Geocoder();
                const response = await geocoder.geocode({ location: coords });
                if (response.results[0]) {
                     setPickup(response.results[0].formatted_address);
                     showToast("Location found");
                } else {
                     setPickup(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                     showToast("GPS Location Found");
                }
            } catch (e) {
                 setPickup(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                 showToast("GPS Location Found");
            }
          } else {
            setPickup(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            showToast("GPS Location Found");
          }
       }, (err) => {
          console.error(err);
          showToast("Could not access location.");
       });
    } else {
        showToast("Geolocation is not supported.");
    }
  };

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
  }

  // Sync real map stats to the selected route
  const handleRouteStatsUpdate = (distanceKm: number, durationMin: number) => {
      if (!selectedRouteId) return;
      
      setTripData(prev => {
          if (!prev) return null;
          
          const updatedRoutes = prev.routes.map(r => {
              if (r.id === selectedRouteId) {
                  // Only update if current data is 'estimated' or different
                  if (Math.abs(r.distanceKm - distanceKm) < 0.05 && Math.abs(r.durationMin - durationMin) < 1) {
                      return r; // No significant change
                  }
                  return { ...r, distanceKm, durationMin };
              }
              return r;
          });
          
          return { ...prev, routes: updatedRoutes };
      });
  };

  const triggerApiKeyUpdate = () => {
      setApiKey(null);
  };

  const selectedRoute = tripData?.routes.find(r => r.id === selectedRouteId);
  const selectedRouteIndex = tripData?.routes.findIndex(r => r.id === selectedRouteId) ?? 0;
  const isRecommended = selectedRouteId === tripData?.recommendedRouteId;

  return (
    <div className="h-full flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white relative transition-colors duration-300">
      <Header 
        onHistoryClick={() => setShowHistory(true)} 
        onDashboardClick={handleDashboardClick}
        onSettingsClick={() => setShowSettings(true)}
        theme={settings.theme}
        onToggleTheme={toggleTheme}
      />
      
      <main className="flex-1 flex overflow-hidden relative">
        <InputPanel 
          pickup={pickup}
          setPickup={setPickup}
          setPickupCoords={setPickupCoords}
          dropoff={dropoff}
          setDropoff={setDropoff}
          setDropoffCoords={setDropoffCoords}
          settings={settings}
          addBuffer={addBuffer}
          setAddBuffer={setAddBuffer}
          onTripGenerated={handleTripGenerated}
          onRouteSelected={handleRouteSelected}
          selectedRouteId={selectedRouteId}
          tripData={tripData}
          isMapLoaded={isMapLoaded}
        />
        
        <div className="flex-1 relative min-h-[50%] lg:min-h-auto">
            <MapVisualization 
              pickup={pickup}
              dropoff={dropoff}
              pickupCoords={pickupCoords}
              dropoffCoords={dropoffCoords}
              selectedRoute={selectedRoute}
              routeIndex={selectedRouteIndex}
              isRecommended={isRecommended}
              showBuffer={addBuffer}
              onLocationFound={handleLocationFound}
              isMapLoaded={isMapLoaded}
              onUpdateApiKey={triggerApiKeyUpdate}
              onRouteStatsUpdate={handleRouteStatsUpdate}
            />
            
            {!apiKey && (
              <ApiKeyModal onSave={(key) => loadGoogleMaps(key)} />
            )}
        </div>
      </main>

      {/* Modals */}
      {showHistory && (
          <HistoryModal 
            history={history}
            onSelect={handleHistorySelect}
            onClose={() => setShowHistory(false)}
          />
      )}

      {showSettings && (
        <SettingsModal 
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Toast */}
      {toastMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-3 rounded-full shadow-lg font-semibold text-sm animate-fade-in-up flex items-center gap-2 pointer-events-none">
              <span className="material-symbols-outlined text-lg">info</span>
              {toastMessage}
          </div>
      )}
    </div>
  );
}

export default App;