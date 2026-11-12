import React from 'react';
import { 
  FolderLock, 
  Files, 
  Clock, 
  Share2, 
  HardDrive, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon,
  Zap,
  Radio,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { StorageStats } from '../types';
import { formatFileSize } from '../utils/formatters';

interface SidebarProps {
  currentView: 'all' | 'recent' | 'portals' | 'storage';
  setCurrentView: (view: 'all' | 'recent' | 'portals' | 'storage') => void;
  stats: StorageStats | null;
  onOpenUpload: () => void;
  onOpenPortalModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  stats,
  onOpenUpload,
  onOpenPortalModal
}) => {
  const { user, logout } = useAuth();

  const usedBytes = stats?.totalBytes || 0;
  const quotaBytes = stats?.quotaBytes || 5 * 1024 * 1024 * 1024;
  const percentUsed = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));

  return (
    <aside className="w-64 md:w-72 shrink-0 h-screen sticky top-0 flex flex-col justify-between cyber-sidebar border-r border-white/15 p-5 select-none z-20 text-slate-200">
      {/* Top Branding Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-zinc-800 via-zinc-700 to-white p-0.5 shadow-lg shadow-white/10">
            <div className="w-full h-full rounded-[10px] bg-black flex items-center justify-center border border-white/40">
              <FolderLock className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </div>
            {/* Monochromatic cyber corner accents */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-cyber text-xl font-black tracking-wider text-white neon-glow-silver">
                SuVault
              </span>
              <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-white/30 uppercase">
                2000
              </span>
            </div>
            <p className="text-[11px] font-tech text-zinc-400 tracking-wide flex items-center gap-1 mt-0.5">
              <Radio className="w-3 h-3 text-white animate-pulse" />
              MONOCHROME VAULT
            </p>
          </div>
        </div>

        {/* Quick Upload Action */}
        <button
          onClick={onOpenUpload}
          className="w-full py-2.5 px-4 chrome-btn font-cyber font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.98]"
        >
          <Zap className="w-4 h-4 fill-black group-hover:scale-110 transition-transform" />
          <span>Upload Files</span>
        </button>

        {/* Navigation Links */}
        <nav className="space-y-1.5 font-tech">
          <button
            onClick={() => setCurrentView('all')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              currentView === 'all'
                ? 'bg-white/10 text-white border border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.15)] font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60 border border-transparent'
            }`}
          >
            <Files className={`w-4 h-4 ${currentView === 'all' ? 'text-white' : 'text-zinc-500'}`} />
            <span>[ ALL FILES ]</span>
            {stats && (
              <span className="ml-auto text-[11px] font-mono tabular-nums px-2 py-0.5 rounded bg-zinc-900 border border-white/20 text-zinc-300">
                {stats.totalFiles}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('recent')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              currentView === 'recent'
                ? 'bg-white/10 text-white border border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.15)] font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60 border border-transparent'
            }`}
          >
            <Clock className={`w-4 h-4 ${currentView === 'recent' ? 'text-white' : 'text-zinc-500'}`} />
            <span>[ RECENT UPLOADS ]</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('portals');
              onOpenPortalModal();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              currentView === 'portals'
                ? 'bg-white/10 text-white border border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.15)] font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60 border border-transparent'
            }`}
          >
            <Share2 className={`w-4 h-4 ${currentView === 'portals' ? 'text-white' : 'text-zinc-500'}`} />
            <span>[ CLIENT SHARE LINK ]</span>
          </button>

          <button
            onClick={() => setCurrentView('storage')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              currentView === 'storage'
                ? 'bg-white/10 text-white border border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.15)] font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60 border border-transparent'
            }`}
          >
            <HardDrive className={`w-4 h-4 ${currentView === 'storage' ? 'text-white' : 'text-zinc-500'}`} />
            <span>[ STORAGE & QUOTA ]</span>
          </button>
        </nav>
      </div>

      {/* Monochromatic Storage Meter & User Profile Card */}
      <div className="space-y-4 pt-4 border-t border-white/15">
        {/* Storage Bar Preview */}
        <div className="p-3 bg-zinc-950 rounded-xl border border-white/20 shadow-inner">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
            <span className="text-zinc-300 font-semibold flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-white" />
              SECTOR_STORAGE
            </span>
            <span className="tabular-nums text-zinc-400">
              {formatFileSize(usedBytes)} / {formatFileSize(quotaBytes)}
            </span>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-2 p-0.5 border border-white/20 overflow-hidden">
            <div
              className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-white h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
              style={{ width: `${Math.max(2, percentUsed)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1 text-white">
              <ShieldCheck className="w-3 h-3" />
              256-BIT ENCRYPTED
            </span>
            <span className="text-zinc-300">{percentUsed}% ALLOCATED</span>
          </div>
        </div>

        {/* User Account Card & Sign Out */}
        <div className="p-2.5 bg-zinc-950 rounded-xl border border-white/20 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.role === 'freelancer' ? (
              <img
                src="/src/assets/images/avatar_monochrome_designer_1794476735995.jpg"
                alt={user.name}
                className="w-10 h-10 rounded-xl object-cover border border-white/60 shadow-[0_0_8px_rgba(255,255,255,0.4)] shrink-0 grayscale"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-cyber font-bold text-xs shrink-0 border border-white/40">
                {user?.name?.slice(0, 2).toUpperCase() || <UserIcon className="w-4 h-4" />}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-cyber font-bold text-white truncate" title={user?.name}>
                {user?.name || 'CYBER_USER'}
              </p>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className="text-zinc-300 uppercase">
                  {user?.role === 'freelancer' ? 'DESIGNER' : 'CLIENT'}
                </span>
                {user?.company && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400 truncate max-w-[80px]" title={user.company}>
                      {user.company}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-white/30 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
