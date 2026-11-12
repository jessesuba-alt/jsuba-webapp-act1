import React, { useState } from 'react';
import { 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  PenTool, 
  File as FileIcon, 
  Share2, 
  Check, 
  Calendar,
  Layers,
  ArrowUpDown,
  Disc
} from 'lucide-react';
import type { VaultFile } from '../types';
import { formatFileSize, formatDate, formatDateTime, getFileTypeInfo } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface FileListProps {
  files: VaultFile[];
  searchQuery: string;
  viewMode: 'grid' | 'table';
  onDeleteFile: (fileId: string, fileName: string) => void;
  onPreviewFile: (file: VaultFile) => void;
  onOpenUpload: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  searchQuery,
  viewMode,
  onDeleteFile,
  onPreviewFile,
  onOpenUpload
}) => {
  const { token } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter by category
  const categoryFiltered = files.filter(f => {
    if (selectedCategory === 'All') return true;
    return f.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Filter by search query
  const filteredFiles = categoryFiltered.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.originalName.toLowerCase().includes(q) ||
      (f.notes && f.notes.toLowerCase().includes(q)) ||
      f.category.toLowerCase().includes(q)
    );
  });

  // Sort
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    const timeA = new Date(a.uploadedAt).getTime();
    const timeB = new Date(b.uploadedAt).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const getFileIcon = (file: VaultFile) => {
    const info = getFileTypeInfo(file.originalName, file.mimeType);
    switch (info.iconType) {
      case 'design':
        return <PenTool className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-zinc-200 drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />;
      case 'archive':
        return <Disc className="w-5 h-5 text-zinc-300 drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />;
      case 'document':
        return <FileText className="w-5 h-5 text-zinc-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />;
      default:
        return <FileIcon className="w-5 h-5 text-zinc-400" />;
    }
  };

  const handleDownload = (file: VaultFile) => {
    if (!token) return;
    const url = `/api/files/${file.id}/download?token=${encodeURIComponent(token)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = (file: VaultFile) => {
    const url = `${window.location.origin}/api/files/${file.id}/download`;
    navigator.clipboard.writeText(url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = ['All', 'Deliverable', 'Design', 'Image', 'Document'];

  return (
    <div className="space-y-4 text-white">
      {/* Category Pills & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Monochromatic Segmented Filter Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-white/20 shadow-inner">
          {categories.map((cat) => {
            const count = cat === 'All' 
              ? files.length 
              : files.filter(f => f.category.toLowerCase() === cat.toLowerCase()).length;
            
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-tech font-semibold tracking-wide rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white/20 text-white border border-white/60 shadow-[0_0_12px_rgba(255,255,255,0.2)] font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <span>[ {cat.toUpperCase()} ]</span>
                <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                  selectedCategory === cat ? 'bg-black text-white border border-white/40' : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort & Counter */}
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
          <span className="tabular-nums">
            RECORDS: {sortedFiles.length}
          </span>
          <button
            onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 hover:text-white cursor-pointer font-tech font-semibold tracking-wider text-zinc-300"
            title="Sort by date"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-white" />
            <span>{sortOrder === 'desc' ? 'NEWEST_FIRST' : 'OLDEST_FIRST'}</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {sortedFiles.length === 0 && (
        <div className="p-12 text-center rounded-2xl cyber-card border border-dashed border-white/20 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-white/30 text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            <Layers className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-cyber text-sm font-bold text-white tracking-wide">
              {searchQuery ? 'NO MATCHING DATA PACKETS FOUND' : 'VAULT PARTITION EMPTY'}
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              {searchQuery
                ? `System query for "${searchQuery}" returned zero matches.`
                : 'Upload creative client deliverables, design archives, specifications, or media files.'}
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 chrome-btn font-cyber font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            Upload First Data Item
          </button>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && sortedFiles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedFiles.map((file) => {
            return (
              <div
                key={file.id}
                className="group relative bg-zinc-950/90 hover:bg-zinc-900 rounded-2xl border border-white/15 hover:border-white/50 p-4 shadow-lg hover:shadow-[0_0_25px_rgba(255,255,255,0.12)] transition-all flex flex-col justify-between cyber-card"
              >
                {/* Decorative monochromatic cyber corner tick */}
                <div className="absolute top-2 right-2 text-[9px] font-mono text-zinc-500">ID:{file.id.slice(-4)}</div>

                {/* Top preview frame */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                        {getFileIcon(file)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-200 border border-white/25">
                          {file.category}
                        </span>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onPreviewFile(file)}
                        title="View File Details"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(file)}
                        title="Download Data"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteFile(file.id, file.originalName)}
                        title="Purge File"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* File Name & Notes */}
                  <div>
                    <h4
                      className="font-tech text-sm font-bold text-white tracking-wide truncate hover:text-zinc-200 transition-colors cursor-pointer"
                      title={file.originalName}
                      onClick={() => onPreviewFile(file)}
                    >
                      {file.originalName}
                    </h4>
                    {file.notes ? (
                      <p className="text-xs font-mono text-zinc-400 line-clamp-2 mt-1">
                        {file.notes}
                      </p>
                    ) : (
                      <p className="text-xs font-mono text-zinc-600 italic mt-1">
                        // No client note attached
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="pt-3 mt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span className="tabular-nums text-white font-semibold">
                    {formatFileSize(file.size)}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Calendar className="w-3 h-3 text-zinc-300" />
                      {formatDate(file.uploadedAt)}
                    </span>
                    <button
                      onClick={() => handleCopyLink(file)}
                      title="Copy Share Link"
                      className="p-1 text-zinc-400 hover:text-white transition-colors"
                    >
                      {copiedId === file.id ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE / LIST VIEW */}
      {viewMode === 'table' && sortedFiles.length > 0 && (
        <div className="bg-zinc-950 rounded-2xl border border-white/20 shadow-2xl overflow-hidden cyber-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-white/15 bg-black text-white text-xs font-cyber tracking-wider">
                  <th className="py-3 px-4">FILE_NAME</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4 text-right">SIZE</th>
                  <th className="py-3 px-4 text-right">TIMESTAMP</th>
                  <th className="py-3 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-xs text-zinc-300">
                {sortedFiles.map((file) => {
                  return (
                    <tr
                      key={file.id}
                      className="hover:bg-zinc-900 transition-colors group"
                    >
                      {/* Name & Icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 max-w-sm sm:max-w-md">
                          <div className="p-1.5 rounded-lg bg-zinc-900 border border-white/20 text-white shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="truncate font-tech">
                            <span
                              onClick={() => onPreviewFile(file)}
                              className="font-bold text-white hover:text-zinc-200 cursor-pointer block truncate text-sm"
                              title={file.originalName}
                            >
                              {file.originalName}
                            </span>
                            {file.notes && (
                              <span className="text-[11px] font-mono text-zinc-500 block truncate">
                                // {file.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-200 border border-white/25">
                          {file.category}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap text-white font-semibold">
                        {formatFileSize(file.size)}
                      </td>

                      {/* Upload Date */}
                      <td className="py-3 px-4 text-right text-zinc-400 whitespace-nowrap tabular-nums">
                        {formatDateTime(file.uploadedAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onPreviewFile(file)}
                            title="Preview File"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            title="Download File"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyLink(file)}
                            title="Copy Share Link"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => onDeleteFile(file.id, file.originalName)}
                            title="Delete File"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
