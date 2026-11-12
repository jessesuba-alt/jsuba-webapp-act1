import React from 'react';
import { Search, LayoutGrid, List, Plus, Menu, X, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopNavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  onOpenUpload: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  currentView: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onOpenUpload,
  mobileMenuOpen,
  setMobileMenuOpen,
  currentView
}) => {
  const { user } = useAuth();

  const getHeading = () => {
    switch (currentView) {
      case 'recent':
        return 'RECENT_UPLOADS.SYS';
      case 'portals':
        return 'CLIENT_PORTALS.EXE';
      case 'storage':
        return 'VAULT_STORAGE_CORE';
      default:
        return 'DATA_VAULT_FILES';
    }
  };

  return (
    <header className="sticky top-0 z-10 cyber-panel border-b border-white/15 px-6 py-4 flex items-center justify-between gap-4 text-white">
      {/* Left: Mobile hamburger & cyber breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white hover:bg-zinc-800 rounded-lg border border-white/20"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-white" />
              PORTAL_ROOT
            </span>
            <span>//</span>
            <span className="uppercase text-white font-semibold">{user?.role || 'CLIENT'}</span>
          </div>
          <h1 className="font-cyber text-lg sm:text-xl font-bold tracking-wider text-white neon-glow-silver flex items-center gap-2">
            <span>{getHeading()}</span>
          </h1>
        </div>
      </div>

      {/* Right: Monochromatic search, view toggles & Action */}
      <div className="flex items-center gap-3">
        {/* Search input with monochromatic cyber aesthetic */}
        <div className="relative hidden sm:block w-56 md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search data files..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-zinc-950 text-white border border-white/20 rounded-lg focus:outline-none focus:border-white focus:shadow-[0_0_12px_rgba(255,255,255,0.25)] placeholder:text-zinc-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs px-1 font-mono"
            >
              [X]
            </button>
          )}
        </div>

        {/* View Toggle (Grid vs Table) */}
        <div className="flex items-center p-0.5 bg-zinc-950 rounded-lg border border-white/20 text-zinc-400">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid Matrix View"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white/20 text-white border border-white/60 shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                : 'hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Telemetry Table View"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-white/20 text-white border border-white/60 shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                : 'hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="px-3.5 py-1.5 chrome-btn font-cyber font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Upload File</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </div>
    </header>
  );
};
