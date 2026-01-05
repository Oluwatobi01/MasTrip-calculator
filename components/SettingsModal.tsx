import React from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdate: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdate, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in-up" onClick={onClose}>
      <div 
        className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
             <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <span className="material-symbols-outlined">settings</span>
             </div>
             <h2 className="font-bold text-lg text-slate-900 dark:text-white">App Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
           {/* Currency Setting */}
           <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Currency Symbol</label>
              <div className="grid grid-cols-4 gap-2">
                 {['₦', '$', '£', '€'].map(curr => (
                    <button
                        key={curr}
                        onClick={() => onUpdate({ currency: curr })}
                        className={`py-2 rounded-xl font-bold border-2 transition-all ${
                            settings.currency === curr 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                        {curr}
                    </button>
                 ))}
              </div>
           </div>

           {/* Rate Setting */}
           <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Rate per KM</label>
              <div className="relative">
                 <span className="absolute left-4 top-3 text-slate-400 font-bold">{settings.currency}</span>
                 <input 
                    type="number"
                    value={settings.ratePerKm}
                    onChange={(e) => onUpdate({ ratePerKm: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold"
                 />
              </div>
              <p className="text-xs text-slate-500 mt-2">Base rate used to calculate estimated trip fares.</p>
           </div>
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-right">
            <button 
                onClick={onClose}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-glow"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};