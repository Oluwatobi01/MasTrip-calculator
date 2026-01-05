import React from 'react';
import { TripEstimation } from '../types';

interface HistoryModalProps {
  history: TripEstimation[];
  onSelect: (trip: TripEstimation) => void;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onSelect, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up" onClick={onClose}>
      <div 
        className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Trip History</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center opacity-50">
                <span className="material-symbols-outlined text-4xl mb-2">history_toggle_off</span>
                <span className="text-sm">No recent trips found.</span>
            </div>
          ) : (
            history.map((trip) => (
              <div 
                key={trip.id}
                onClick={() => { onSelect(trip); onClose(); }}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary cursor-pointer transition-all bg-slate-50 dark:bg-slate-900/50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                     <span className="material-symbols-outlined text-lg">history</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-slate-900 dark:text-white">{trip.dropoff}</div>
                    <div className="text-xs text-slate-500 truncate">From: {trip.pickup}</div>
                  </div>
                  <div className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                    {new Date(trip.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}