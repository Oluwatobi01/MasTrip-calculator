import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [key, setKey] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('google_maps_api_key');
    if (saved) setKey(saved);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim().length > 10) {
      localStorage.setItem('google_maps_api_key', key.trim());
      // Reload is required to cleanly replace the Google Maps script with the new key
      window.location.reload();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-primary/10 p-6 text-center border-b border-primary/10">
          <div className="size-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
            <span className="material-symbols-outlined text-3xl">map</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Activate Google Maps</h2>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-2">
            <p>A valid API key is required to load the map and calculate routes.</p>
            <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 p-3 rounded-lg text-left text-xs border border-orange-100 dark:border-orange-800/30">
              <strong>Required APIs (Enable in Cloud Console):</strong>
              <ul className="list-disc list-inside mt-1 ml-1 space-y-0.5 opacity-90">
                <li>Maps JavaScript API</li>
                <li>Directions API</li>
                <li>Places API (New)</li>
              </ul>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Google Maps API Key</label>
              <input 
                type="text" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={key.length < 10}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Enable Map</span>
              <span className="material-symbols-outlined text-lg">rocket_launch</span>
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <a 
              href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Don't have a key? Get one here</span>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};