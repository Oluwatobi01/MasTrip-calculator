import React, { useState } from 'react';

interface CoordinatesModalProps {
  type: 'pickup' | 'dropoff';
  onSave: (coords: string) => void;
  onClose: () => void;
}

export const CoordinatesModal: React.FC<CoordinatesModalProps> = ({ type, onSave, onClose }) => {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const handleSave = () => {
    if (lat && lng) {
      onSave(`${lat}, ${lng}`);
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in-up" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 p-2.5 rounded-full text-primary">
                <span className="material-symbols-outlined">add_location</span>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Enter Coordinates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    For {type === 'pickup' ? 'Pickup' : 'Dropoff'} Location
                </p>
            </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Latitude</label>
            <input 
              type="number" 
              step="any"
              value={lat}
              onChange={e => setLat(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 dark:text-white font-mono text-sm"
              placeholder="e.g. 9.0820"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Longitude</label>
            <input 
              type="number" 
              step="any"
              value={lng}
              onChange={e => setLng(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 dark:text-white font-mono text-sm"
              placeholder="e.g. 8.6753"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={!lat || !lng} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-glow hover:bg-primary-dark transition-colors disabled:opacity-50">Set Location</button>
          </div>
        </div>
      </div>
    </div>
  );
};