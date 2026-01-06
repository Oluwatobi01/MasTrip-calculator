import React, { useState, useEffect, useRef } from 'react';
import { calculateTripOptions } from '../services/geminiService';
import { TripEstimation, AppSettings } from '../types';
import { SuggestedRoutes } from './SuggestedRoutes';
import { CoordinatesModal } from './CoordinatesModal';

interface InputPanelProps {
  pickup: string;
  setPickup: (val: string) => void;
  setPickupCoords: (coords: {lat: number, lng: number} | null) => void;
  dropoff: string;
  setDropoff: (val: string) => void;
  setDropoffCoords: (coords: {lat: number, lng: number} | null) => void;
  settings: AppSettings;
  addBuffer: boolean;
  setAddBuffer: (val: boolean) => void;
  
  onTripGenerated: (data: TripEstimation) => void;
  onRouteSelected: (routeId: string) => void;
  selectedRouteId: string | null;
  tripData: TripEstimation | null;
  isMapLoaded: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ 
  pickup, setPickup, setPickupCoords,
  dropoff, setDropoff, setDropoffCoords,
  settings,
  addBuffer, setAddBuffer,
  onTripGenerated, 
  onRouteSelected, 
  selectedRouteId, 
  tripData,
  isMapLoaded
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [coordsModalType, setCoordsModalType] = useState<'pickup' | 'dropoff' | null>(null);
  
  // Refs for inputs
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);

  // Initialize Autocomplete using modern importLibrary with fallback
  useEffect(() => {
    if (!isMapLoaded || !window.google || !window.google.maps) return;

    let pickupAutocomplete: any;
    let dropoffAutocomplete: any;

    const initAutocomplete = async () => {
      try {
        let AutocompleteClass;
        
        // Try dynamic import first, fallback to global legacy object
        if (window.google.maps.importLibrary) {
            const { Autocomplete } = await window.google.maps.importLibrary("places");
            AutocompleteClass = Autocomplete;
        } else if (window.google.maps.places && window.google.maps.places.Autocomplete) {
            AutocompleteClass = window.google.maps.places.Autocomplete;
        }

        if (!AutocompleteClass) {
            console.warn("Google Maps Places library not found.");
            return;
        }

        const options = {
          fields: ["formatted_address", "geometry", "name"],
          strictBounds: false,
        };

        if (pickupInputRef.current) {
          pickupAutocomplete = new AutocompleteClass(pickupInputRef.current, options);
          pickupAutocomplete.addListener("place_changed", () => {
            const place = pickupAutocomplete.getPlace();
            
            // Set Text
            if (place.formatted_address) {
              setPickup(place.formatted_address);
            } else if (place.name) {
              setPickup(place.name);
            }

            // Set Coords (Robustness)
            if (place.geometry && place.geometry.location) {
                setPickupCoords({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                });
            } else {
                setPickupCoords(null); // Clear if no geometry (e.g. some loose string matches)
            }
          });
        }

        if (dropoffInputRef.current) {
          dropoffAutocomplete = new AutocompleteClass(dropoffInputRef.current, options);
          dropoffAutocomplete.addListener("place_changed", () => {
            const place = dropoffAutocomplete.getPlace();
            
            // Set Text
            if (place.formatted_address) {
              setDropoff(place.formatted_address);
            } else if (place.name) {
              setDropoff(place.name);
            }

             // Set Coords (Robustness)
             if (place.geometry && place.geometry.location) {
                setDropoffCoords({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                });
            } else {
                setDropoffCoords(null);
            }
          });
        }
      } catch (e) {
        console.error("Failed to load Places library:", e);
      }
    };

    initAutocomplete();

    return () => {
        if (window.google && window.google.maps && window.google.maps.event) {
            if (pickupAutocomplete) window.google.maps.event.clearInstanceListeners(pickupAutocomplete);
            if (dropoffAutocomplete) window.google.maps.event.clearInstanceListeners(dropoffAutocomplete);
        }
    };
  }, [isMapLoaded, setPickup, setDropoff, setPickupCoords, setDropoffCoords]);

  const handleCalculate = async () => {
    if (!pickup || !dropoff) return;
    setIsLoading(true);
    try {
      const data = await calculateTripOptions(pickup, dropoff);
      onTripGenerated(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleCalculate();
    }
  };

  const handleSwap = () => {
    const temp = pickup;
    setPickup(dropoff);
    setDropoff(temp);
    setPickupCoords(null);
    setDropoffCoords(null);
  };

  const handleClear = () => {
      setPickup('');
      setDropoff('');
      setPickupCoords(null);
      setDropoffCoords(null);
  };

  const handleCoordsSave = (coords: string) => {
    const [latStr, lngStr] = coords.split(',').map(s => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const isValid = !isNaN(lat) && !isNaN(lng);

    if (coordsModalType === 'pickup') {
        setPickup(coords);
        if (isValid) setPickupCoords({lat, lng});
    } else {
        setDropoff(coords);
        if (isValid) setDropoffCoords({lat, lng});
    }
    setCoordsModalType(null);
  }

  const selectedRoute = tripData?.routes.find(r => r.id === selectedRouteId);
  const effectiveDistance = selectedRoute ? (selectedRoute.distanceKm + (addBuffer ? 2 : 0)) : 0;
  const totalFare = (effectiveDistance * settings.ratePerKm).toFixed(2);

  return (
    <div className="w-full lg:w-[480px] flex flex-col bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 overflow-y-auto z-10 shadow-xl lg:shadow-none h-full relative transition-colors duration-300">
      <div className="p-6 lg:p-8 shrink-0">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Plan Your Trip
            </h1>
            {(pickup || dropoff) && (
                <button 
                  onClick={handleClear}
                  className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                >
                    Clear All
                </button>
            )}
        </div>

        <div className="space-y-4 mb-8">
          {/* Pickup Input */}
          <div className="group relative z-20">
            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined">my_location</span>
            </div>
            <input
              ref={pickupInputRef}
              type="text"
              value={pickup}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                  setPickup(e.target.value);
                  setPickupCoords(null);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-3.5 pl-12 pr-24 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder-slate-400"
              placeholder="Pickup Location"
            />
            
            {/* Connector Line */}
            <div className="absolute left-[29px] top-[46px] h-8 w-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>
            
            {/* Action Buttons */}
            <div className="absolute right-3 top-3.5 flex items-center gap-1 z-30">
                <button 
                  onClick={() => setCoordsModalType('pickup')}
                  className="p-1 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                  title="Enter Coordinates Manually"
                >
                  <span className="material-symbols-outlined text-lg">add_location</span>
                </button>
                <button 
                  onClick={handleSwap}
                  className="p-1 text-slate-400 hover:text-primary transition-colors bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700"
                  title="Swap Locations"
                >
                  <span className="material-symbols-outlined text-lg">swap_vert</span>
                </button>
            </div>
          </div>

          {/* Dropoff Input */}
          <div className="group relative z-10">
            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-red-500 transition-colors">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <input
              ref={dropoffInputRef}
              type="text"
              value={dropoff}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                  setDropoff(e.target.value);
                  setDropoffCoords(null);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-3.5 pl-12 pr-14 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder-slate-400"
              placeholder="Where to?"
            />
            <div className="absolute right-3 top-3.5 z-30">
                <button 
                  onClick={() => setCoordsModalType('dropoff')}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                  title="Enter Coordinates Manually"
                >
                  <span className="material-symbols-outlined text-lg">add_location</span>
                </button>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="relative flex-none">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold">
                    {settings.currency} {settings.ratePerKm}/km
                </div>
            </div>
            
            <button
              onClick={handleCalculate}
              disabled={isLoading || !pickup || !dropoff}
              className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-xl py-3.5 px-6 font-bold shadow-glow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <span>Find Routes</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>

        {tripData && selectedRoute && !isLoading && (
          <div className="animate-fade-in-up">
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl p-6 shadow-xl mb-4 relative overflow-hidden transition-colors duration-300">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 dark:bg-black/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">Estimated Fare</span>
                <div className="text-5xl font-black tracking-tight mb-2">
                  {settings.currency}{totalFare}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                  <span>{effectiveDistance.toFixed(1)} km</span>
                  <span className="w-1 h-1 bg-current rounded-full"></span>
                  <span>{selectedRoute.durationMin} mins</span>
                </div>
              </div>
            </div>

            <button
                onClick={() => setAddBuffer(!addBuffer)}
                className={`w-full py-3 mb-6 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all duration-200 text-sm ${
                    addBuffer
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary'
                }`}
            >
                <span className={`material-symbols-outlined transition-transform ${addBuffer ? 'scale-110 filled' : ''}`}>
                    {addBuffer ? 'check_circle' : 'add_circle'}
                </span>
                Location is a bit fuzzy? Add 2km buffer
            </button>

            <SuggestedRoutes 
              routes={tripData.routes}
              selectedRouteId={selectedRouteId || ''}
              recommendedRouteId={tripData.recommendedRouteId}
              onSelectRoute={onRouteSelected}
              ratePerKm={settings.ratePerKm}
              addBuffer={addBuffer}
              currency={settings.currency}
            />
          </div>
        )}
        
        {!tripData && !isLoading && (
          <div className="flex flex-col items-center justify-center py-10 opacity-60">
             <img 
               src="https://img.freepik.com/free-vector/gps-navigation-concept-illustration_114360-9922.jpg?w=740&t=st=1708453483~exp=1708454083~hmac=1b53e4b7852a3928155985870295874288059081829285038389659021966112" 
               alt="Map Navigation" 
               className="w-64 h-auto mix-blend-multiply dark:mix-blend-screen mb-6 grayscale hover:grayscale-0 transition-all duration-500"
             />
            <p className="font-medium text-slate-500 dark:text-slate-400">Enter locations to calculate your best route</p>
          </div>
        )}
      </div>

      {coordsModalType && (
        <CoordinatesModal
            type={coordsModalType}
            onSave={handleCoordsSave}
            onClose={() => setCoordsModalType(null)}
        />
      )}
    </div>
  );
};