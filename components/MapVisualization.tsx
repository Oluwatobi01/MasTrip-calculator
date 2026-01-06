import React, { useEffect, useRef, useState } from 'react';
import { RouteOption } from '../types';

interface MapVisualizationProps {
  pickup: string;
  dropoff: string;
  pickupCoords: { lat: number; lng: number } | null;
  dropoffCoords: { lat: number; lng: number } | null;
  selectedRoute: RouteOption | undefined;
  showBuffer: boolean;
  onLocationFound: () => void;
  isMapLoaded: boolean;
  onUpdateApiKey?: () => void;
  onRouteStatsUpdate?: (distanceKm: number, durationMin: number) => void;
  routeIndex?: number;
  isRecommended?: boolean;
}

// Declare google namespace
declare global {
  interface Window {
    google: any;
  }
}

export const MapVisualization: React.FC<MapVisualizationProps> = ({ 
  pickup, 
  dropoff, 
  pickupCoords,
  dropoffCoords,
  selectedRoute,
  showBuffer,
  onLocationFound,
  isMapLoaded,
  onUpdateApiKey,
  onRouteStatsUpdate,
  routeIndex = 0,
  isRecommended = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [fallbackPolyline, setFallbackPolyline] = useState<any>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [directionsResult, setDirectionsResult] = useState<any>(null);

  // Map Styles
  const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  ];

  // Initialize Map only when loaded
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || mapInstance) return;

    const initMap = async () => {
      try {
        let MapClass, ControlPositionEnum;

        // Try using modern importLibrary if available
        if (window.google.maps.importLibrary) {
            const lib = await window.google.maps.importLibrary("maps");
            MapClass = lib.Map;
            ControlPositionEnum = lib.ControlPosition;
        } else {
            // Fallback to legacy global objects
            MapClass = window.google.maps.Map;
            ControlPositionEnum = window.google.maps.ControlPosition;
        }
        
        const map = new MapClass(mapRef.current, {
          center: { lat: 9.0820, lng: 8.6753 }, // Default to Nigeria
          zoom: 13,
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: ControlPositionEnum?.RIGHT_TOP || 5 },
          mapTypeControl: false,
          streetViewControl: false,
        });

        const ds = new window.google.maps.DirectionsService();
        const dr = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: "#2b8cee",
            strokeWeight: 6,
            strokeOpacity: 0.8
          }
        });

        // Initialize Geocoder for fallback
        const gc = new window.google.maps.Geocoder();

        // Initialize a fallback polyline (invisible initially)
        const poly = new window.google.maps.Polyline({
            path: [],
            geodesic: true,
            strokeColor: '#2b8cee',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: map,
            icons: [{
                icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                offset: '0',
                repeat: '20px'
            }, {
                icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                offset: '100%'
            }]
        });

        setMapInstance(map);
        setDirectionsService(ds);
        setDirectionsRenderer(dr);
        setGeocoder(gc);
        setFallbackPolyline(poly);

      } catch (e) {
        console.error("Error initializing map:", e);
        setRoutingError("Failed to initialize map. Check API Key configuration.");
      }
    };

    initMap();
  }, [isMapLoaded]);

  // Handle Routing (Fetch Only)
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !fallbackPolyline) return;

    // Reset
    fallbackPolyline.setPath([]);
    setUsingFallback(false);
    setRoutingError(null); 
    setDirectionsResult(null);

    // We can route if we have strings OR coords
    const origin = pickupCoords || pickup;
    const destination = dropoffCoords || dropoff;

    // Simple validity check
    const hasValidOrigin = pickupCoords || (pickup && pickup.length > 2);
    const hasValidDest = dropoffCoords || (dropoff && dropoff.length > 2);

    if (!hasValidOrigin || !hasValidDest) return;

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      },
      (result: any, status: any) => {
        if (status === "OK") {
          setDirectionsResult(result);
          directionsRenderer.setDirections(result);
          setRoutingError(null);
          fallbackPolyline.setPath([]); // Clear fallback if success
        } else {
          // ROUTING FAILED - ATTEMPT FALLBACK
          console.warn("Directions API failed:", status, "Attempting fallback...");
          handleFallback(origin, destination, status);
        }
      }
    );
  }, [directionsService, directionsRenderer, fallbackPolyline, geocoder, pickup, dropoff, pickupCoords, dropoffCoords]); 

  // Handle Route Index Switching & Stats Update
  useEffect(() => {
    if (!directionsResult || !directionsRenderer) return;

    // 1. Update the visible route on map
    const routes = directionsResult.routes;
    const validIndex = (routeIndex >= 0 && routeIndex < routes.length) ? routeIndex : 0;
    
    // setRouteIndex updates which route is highlighted
    directionsRenderer.setRouteIndex(validIndex);

    // 2. Extract Real Stats for the SELECTED route index
    const leg = routes[validIndex]?.legs[0];
    if (leg && onRouteStatsUpdate) {
        const distKm = (leg.distance?.value || 0) / 1000;
        const durMin = Math.round((leg.duration?.value || 0) / 60);
        
        onRouteStatsUpdate(distKm, durMin);
    }
  }, [directionsResult, routeIndex, directionsRenderer]);

  const handleFallback = (origin: any, destination: any, originalStatus: string) => {
      if (!fallbackPolyline || !mapInstance) return;

      const activateFallback = (pLat: any, dLat: any) => {
            directionsRenderer.setDirections({routes: []}); // Clear renderer
            
            const path = [pLat, dLat];
            fallbackPolyline.setPath(path);
            
            // Fit bounds for fallback
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(pLat);
            bounds.extend(dLat);
            mapInstance.fitBounds(bounds);
            
            setUsingFallback(true);
            setRoutingError(null); 
            
            // Calculate straight line distance for fallback stats
            if (window.google.maps.geometry && window.google.maps.geometry.spherical && onRouteStatsUpdate) {
                const distMeters = window.google.maps.geometry.spherical.computeDistanceBetween(
                    new window.google.maps.LatLng(pLat), 
                    new window.google.maps.LatLng(dLat)
                );
                onRouteStatsUpdate(distMeters / 1000, Math.round(distMeters / 1000 * 2)); 
            }
        };

        if (pickupCoords && dropoffCoords) {
            activateFallback(pickupCoords, dropoffCoords);
        } else if (geocoder && pickup && dropoff) {
            
            const geocodeWithBias = (address: string): Promise<any> => {
                return new Promise((resolve, reject) => {
                    const options: any = { address };
                    // Bias to current map view to find local streets instead of international ones
                    if (mapInstance) {
                        options.bounds = mapInstance.getBounds();
                    }
                    geocoder.geocode(options, (res: any, stat: any) => {
                         if (stat === 'OK' && res[0]) resolve(res[0].geometry.location);
                         else reject(stat);
                    });
                });
            }

            Promise.all([
                geocodeWithBias(pickup),
                geocodeWithBias(dropoff)
            ]).then(([pLoc, dLoc]: any) => {
                activateFallback(pLoc, dLoc);
            }).catch((err) => {
                console.error("Fallback geocoding failed:", err);
                handleRoutingError(originalStatus);
            });
        } else {
            handleRoutingError(originalStatus);
        }
  };

  const handleRoutingError = (status: string) => {
      // Clean up UI if error occurs
      if (directionsRenderer) directionsRenderer.setDirections({routes: []});
      if (fallbackPolyline) fallbackPolyline.setPath([]);

      if (status === 'REQUEST_DENIED') {
        setRoutingError("Directions API disabled. Check Cloud Console.");
      } else if (status === 'ZERO_RESULTS' || status === 'NOT_FOUND') {
        setRoutingError("No driving route found. Try specific addresses.");
      } else if (status === 'OVER_QUERY_LIMIT') {
        setRoutingError("API Quota exceeded.");
      } else {
        setRoutingError(`Route calculation failed: ${status}`);
      }
  };

  // Handle Buffer Visualization
  useEffect(() => {
    if (!mapInstance || !window.google) return;
    
    if (mapInstance.bufferCircle) {
      mapInstance.bufferCircle.setMap(null);
    }

    if (showBuffer) {
      let center = null;
      // Get center based on current route
      if (directionsResult && directionsResult.routes && directionsResult.routes[routeIndex]) {
          center = directionsResult.routes[routeIndex].legs[0].start_location;
      } else if (fallbackPolyline && fallbackPolyline.getPath().getLength() > 0) {
         center = fallbackPolyline.getPath().getAt(0);
      } else if (pickupCoords) {
         center = pickupCoords;
      }

      if (center) {
        const circle = new window.google.maps.Circle({
          strokeColor: "#4285F4",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#4285F4",
          fillOpacity: 0.15,
          map: mapInstance,
          center: center,
          radius: 2000,
        });
        mapInstance.bufferCircle = circle;
      }
    }
  }, [showBuffer, mapInstance, directionsResult, routeIndex, fallbackPolyline, pickupCoords]);

  return (
    <div className="flex-1 relative h-full min-h-[400px] bg-[#eef2f6] dark:bg-slate-900 overflow-hidden border-2 border-dashed border-primary/40 m-2 rounded-2xl group z-0">
      
      {/* Real Map Container - Always visible if loaded */}
      <div 
        ref={mapRef} 
        className={`w-full h-full absolute inset-0 rounded-xl overflow-hidden transition-all duration-700`}
        style={{ visibility: isMapLoaded ? 'visible' : 'hidden' }}
      />

      {/* Loading State Overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 z-10">
           <div className="animate-pulse flex flex-col items-center opacity-50">
             <span className="material-symbols-outlined text-4xl mb-2">map</span>
             <span className="text-sm font-medium">Loading Map...</span>
           </div>
        </div>
      )}

      {/* Fallback Indicator */}
      {usingFallback && isMapLoaded && (
         <div className="absolute top-4 left-4 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200 dark:border-orange-800 backdrop-blur-sm z-20 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>Straight-line Mode</span>
         </div>
      )}

      {/* Error Overlay */}
      {routingError && isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 backdrop-blur-sm p-4 animate-fade-in-up">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-sm text-center border border-red-200 dark:border-red-900/50">
              <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Map Error</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{routingError}</p>
              
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => setRoutingError(null)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  Dismiss
                </button>
                {onUpdateApiKey && (
                  <button 
                    onClick={() => { setRoutingError(null); onUpdateApiKey(); }}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-md transition-colors"
                  >
                    Update API Key
                  </button>
                )}
              </div>
           </div>
        </div>
      )}

      {/* Controls */}
      {isMapLoaded && (
        <div className="absolute top-6 right-16 flex flex-col gap-2 z-20">
          <button 
              onClick={onLocationFound}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm p-3 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 group/btn"
              title="My Location"
          >
            <span className="material-symbols-outlined group-hover/btn:text-primary transition-colors">my_location</span>
          </button>
        </div>
      )}

      {/* Suggested Route Info Overlay */}
      {selectedRoute && isMapLoaded && !routingError && (
          <div className={`absolute bottom-6 right-4 lg:right-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-4 py-3 rounded-xl shadow-lg z-20 animate-fade-in-up flex flex-col gap-1 border-l-4 ${isRecommended ? 'border-primary' : 'border-slate-400'}`}>
               <div className="flex items-center gap-1.5 mb-1">
                 {isRecommended ? (
                    <>
                      <span className="material-symbols-outlined text-primary text-sm filled">auto_awesome</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Suggested Route</span>
                    </>
                 ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selected Route</span>
                 )}
               </div>
               
               <div className="flex items-center gap-4">
                 <div>
                    <div className="text-lg font-black text-slate-900 dark:text-white leading-none">{selectedRoute.durationMin} min</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Travel Time</div>
                 </div>
                 <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-600"></div>
                 <div>
                    <div className="text-lg font-black text-slate-900 dark:text-white leading-none">{selectedRoute.distanceKm.toFixed(1)} km</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Distance</div>
                 </div>
               </div>
          </div>
      )}
    </div>
  );
};