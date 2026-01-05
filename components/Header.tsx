import React from 'react';

interface HeaderProps {
  onHistoryClick: () => void;
  onDashboardClick: () => void;
  onSettingsClick: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onHistoryClick, 
  onDashboardClick, 
  onSettingsClick,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md px-6 lg:px-10 py-4 shadow-sm h-20 transition-colors duration-300">
      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => window.location.reload()}>
        <div className="size-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
          <span className="material-symbols-outlined text-2xl">local_taxi</span>
        </div>
        <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">Mas Drive</h2>
      </div>
      <div className="flex items-center gap-4 md:gap-8">
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={onDashboardClick} className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-semibold transition-colors">Dashboard</button>
          <button onClick={onHistoryClick} className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-semibold transition-colors">Trip History</button>
          <button onClick={onSettingsClick} className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-semibold transition-colors">Settings</button>
        </nav>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
          <button 
            onClick={onToggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            <span className="material-symbols-outlined filled text-xl">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          <div 
            className="bg-center bg-no-repeat bg-cover rounded-full size-10 ring-2 ring-white dark:ring-slate-800 shadow-sm cursor-pointer hover:ring-primary transition-all ml-1" 
            style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBmgye5HmTXm1k27LS3jz3mt-PmbI-SU6tZB-V-uQoTBuEvYmmAXshN5wgGAhciOfnAGIkZQp_pGp5hXfQ4CYOA5yDOy1PKr37Y-WE9rZvamW01SprudhrG8TK6nHPJIoToPNsrbUIT5A0sMzBQi3bnXAkuL3IRz5R03dXJ97pv3CvcI81hkiuxg5dgSt5pOOaxUhzBE03lBcpGg31-KrQz8ms1oqOUNFrw5q5K_kAVxnfLP3_8JhX1HUTkF5PErwndDme5chjf6AMA")'}}
            title="User Profile"
            onClick={onDashboardClick}
          ></div>
        </div>
      </div>
    </header>
  );
};