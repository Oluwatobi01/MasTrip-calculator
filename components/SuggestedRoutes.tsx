import React from 'react';
import { RouteOption } from '../types';

interface SuggestedRoutesProps {
  routes: RouteOption[];
  selectedRouteId: string;
  recommendedRouteId: string;
  onSelectRoute: (id: string) => void;
  ratePerKm: number;
  addBuffer?: boolean;
  currency: string;
}

export const SuggestedRoutes: React.FC<SuggestedRoutesProps> = ({ 
  routes, 
  selectedRouteId, 
  recommendedRouteId,
  onSelectRoute, 
  ratePerKm, 
  addBuffer = false, 
  currency 
}) => {
  if (routes.length === 0) return null;

  // Sort routes so recommended is first, or keep original order
  // Keeping original order but highlighting recommended is usually better for comparison
  
  return (
    <div className="mt-6 animate-fade-in-up">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">Route Options</h3>
      <div className="space-y-3">
        {routes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          const isRecommended = recommendedRouteId === route.id;
          const distance = route.distanceKm + (addBuffer ? 2 : 0);
          const fare = (distance * ratePerKm).toFixed(2);
          
          return (
            <div 
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group
                ${isSelected 
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-1 ring-primary/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                }
              `}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-3 left-4 bg-gradient-to-r from-primary to-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                  <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                  SUGGESTED ROUTE
                </div>
              )}

              <div className="flex justify-between items-start mb-1 mt-1">
                <div className="flex items-center gap-2">
                   <h4 className={`font-bold ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{route.name}</h4>
                   {route.tags.includes('Fastest') && !isRecommended && (
                     <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">FASTEST</span>
                   )}
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{currency}{fare}</span>
              </div>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{route.description}</p>
              
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">distance</span>
                  {distance.toFixed(1)} km
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {route.durationMin} min
                </div>
                <div className="flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[16px] 
                    ${route.trafficLevel === 'Heavy' ? 'text-red-500' : route.trafficLevel === 'Moderate' ? 'text-amber-500' : 'text-green-500'}
                  `}>traffic</span>
                  {route.trafficLevel} Traffic
                </div>
              </div>

              {isSelected && (
                <div className="absolute right-4 bottom-4 text-primary">
                  <span className="material-symbols-outlined filled">check_circle</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};