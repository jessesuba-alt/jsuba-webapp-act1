import React from 'react';
import { HardDrive, ShieldCheck, FileText, PenTool, Image as ImageIcon, Archive, Server } from 'lucide-react';
import type { StorageStats } from '../types';
import { formatFileSize } from '../utils/formatters';

interface StorageViewProps {
  stats: StorageStats | null;
  onOpenUpload: () => void;
}

export const StorageView: React.FC<StorageViewProps> = ({ stats, onOpenUpload }) => {
  const totalBytes = stats?.totalBytes || 0;
  const quotaBytes = stats?.quotaBytes || 5 * 1024 * 1024 * 1024;
  const percentUsed = Math.min(100, Math.round((totalBytes / quotaBytes) * 100));
  const availableBytes = Math.max(0, quotaBytes - totalBytes);

  const categories = [
    { name: 'Design Files & Archives', key: 'Design', icon: PenTool, color: 'bg-white', textColor: 'text-white' },
    { name: 'Final Deliverables', key: 'Deliverable', icon: ShieldCheck, color: 'bg-zinc-300', textColor: 'text-zinc-200' },
    { name: 'Images & Visual Media', key: 'Image', icon: ImageIcon, color: 'bg-zinc-400', textColor: 'text-zinc-300' },
    { name: 'Documents & Contracts', key: 'Document', icon: FileText, color: 'bg-zinc-500', textColor: 'text-zinc-400' },
    { name: 'Other Data Bundles', key: 'Other', icon: Archive, color: 'bg-zinc-700', textColor: 'text-zinc-500' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-white">
      {/* Top Banner */}
      <div className="bg-zinc-950 rounded-2xl border border-white/20 p-6 cyber-card shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/30 text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <HardDrive className="w-7 h-7 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cyber text-lg font-bold text-white tracking-wide">VAULT_SECTOR_STORAGE</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-white border border-white/30">
                  ONLINE // INDEPENDENT
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Dedicated non-Firebase server vault partition with strict access controls
              </p>
            </div>
          </div>

          <button
            onClick={onOpenUpload}
            className="px-4 py-2 chrome-btn font-cyber font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0"
          >
            Upload More Files
          </button>
        </div>

        {/* Big Monochromatic Storage Gauge */}
        <div className="space-y-2 pt-2 font-mono">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span>{formatFileSize(totalBytes)} OF {formatFileSize(quotaBytes)} COMMITTED</span>
            <span className="tabular-nums text-white font-semibold">{formatFileSize(availableBytes)} FREE DISK SPACE</span>
          </div>

          <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden p-0.5 flex border border-white/20 shadow-inner">
            {categories.map((cat) => {
              const catBytes = stats?.categoryBreakdown[cat.key]?.bytes || 0;
              const catPercent = totalBytes > 0 ? (catBytes / quotaBytes) * 100 : 0;
              if (catPercent <= 0) return null;
              return (
                <div
                  key={cat.key}
                  className={`${cat.color} h-full rounded-sm transition-all duration-500 shadow-[0_0_6px_rgba(255,255,255,0.4)]`}
                  style={{ width: `${Math.max(1, catPercent)}%` }}
                  title={`${cat.name}: ${formatFileSize(catBytes)}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>SECTOR 0</span>
            <span className="text-zinc-300 font-semibold">{percentUsed}% ALLOCATED</span>
            <span>QUOTA CEILING (5 GB)</span>
          </div>
        </div>
      </div>

      {/* Storage Breakdown by Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const catData = stats?.categoryBreakdown[cat.key] || { count: 0, bytes: 0 };
          const Icon = cat.icon;

          return (
            <div
              key={cat.key}
              className="p-5 bg-zinc-950 rounded-2xl border border-white/15 cyber-card shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl bg-zinc-900 border border-white/20 flex items-center justify-center ${cat.textColor} shadow-inner`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-tech text-xs font-bold text-white">{cat.name}</h4>
                    <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                      {catData.count} {catData.count === 1 ? 'record' : 'records'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono tabular-nums font-bold text-white">
                  {formatFileSize(catData.bytes)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture & Isolation Guarantees */}
      <div className="p-6 bg-zinc-950 rounded-2xl border border-white/20 cyber-card space-y-3">
        <div className="flex items-center gap-2 text-white font-cyber font-bold text-sm">
          <Server className="w-4 h-4 text-white" />
          <span>INDEPENDENT VAULT STORAGE ARCHITECTURE</span>
        </div>
        <p className="text-xs font-mono text-zinc-400 leading-relaxed">
          SuVault operates entirely without Firebase Storage or external vendor lock-in. Files are encrypted and written directly to your dedicated node filesystem partition. Every API request validates authorization tokens and enforces strict ownership bounds before reading or unlinking any sector.
        </p>
      </div>
    </div>
  );
};
