import React, { useState } from 'react';
import { X, Download, Calendar, HardDrive, Shield, FileText, Check, Save, Terminal } from 'lucide-react';
import type { VaultFile } from '../types';
import { formatFileSize, formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface FilePreviewModalProps {
  file: VaultFile | null;
  onClose: () => void;
  onUpdateNotes: (fileId: string, notes: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onUpdateNotes
}) => {
  const { token } = useAuth();
  const [notes, setNotes] = useState(file?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const previewUrl = token ? `/api/files/${file.id}/download?token=${encodeURIComponent(token)}&inline=true` : '';

  const handleSaveNotes = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      });
      if (res.ok) {
        onUpdateNotes(file.id, notes);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to update notes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!token) return;
    const url = `/api/files/${file.id}/download?token=${encodeURIComponent(token)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-zinc-950 rounded-2xl border border-white/25 max-w-2xl w-full p-6 shadow-[0_0_40px_rgba(255,255,255,0.15)] cyber-panel space-y-5 max-h-[90vh] overflow-y-auto text-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-zinc-900 text-white border border-white/25">
                {file.category}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                MIME: {file.mimeType}
              </span>
            </div>
            <h3 className="font-tech text-base sm:text-lg font-bold text-white truncate tracking-wide" title={file.originalName}>
              {file.originalName}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Preview Area */}
        {isImage ? (
          <div className="relative rounded-xl overflow-hidden bg-black border border-white/20 flex items-center justify-center min-h-[220px] max-h-[360px] p-2">
            <img
              src={previewUrl}
              alt={file.originalName}
              className="object-contain max-h-[340px] w-auto mx-auto rounded-lg shadow-lg grayscale"
            />
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-zinc-900 border border-white/10 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/30 text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <p className="font-tech text-sm font-bold text-white">{file.originalName}</p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">VAULT_SECTOR_COMMITTED // ZERO_LEAK_POLICY</p>
            </div>
          </div>
        )}

        {/* File Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-zinc-900 rounded-xl border border-white/15 text-xs font-mono">
          <div>
            <span className="text-zinc-400 block mb-0.5 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-white" />
              FILE_SIZE
            </span>
            <span className="tabular-nums text-white font-semibold">
              {formatFileSize(file.size)}
            </span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-white" />
              UPLOAD_DATE
            </span>
            <span className="text-zinc-200">
              {formatDateTime(file.uploadedAt)}
            </span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-0.5 flex items-center gap-1">
              <Shield className="w-3 h-3 text-white" />
              SECURITY_RULE
            </span>
            <span className="text-white font-medium">
              OWNER_ONLY [RESTRICTED]
            </span>
          </div>
        </div>

        {/* Client Notes / Feedback */}
        <div className="space-y-1.5 font-mono">
          <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-white" />
            CLIENT_INSTRUCTIONS & NOTES
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="// Insert client deliverable instructions, revision notes, or color specs..."
              className="w-full text-xs p-3 bg-zinc-900 text-white border border-white/20 rounded-xl focus:outline-none focus:border-white focus:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all placeholder:text-zinc-600"
            />
          </div>
          <div className="flex justify-end font-tech">
            <button
              onClick={handleSaveNotes}
              disabled={isSaving}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-white/20 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>NOTE COMMITTED</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-white" />
                  <span>SAVE INSTRUCTIONS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between font-tech">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
          >
            [ CLOSE ]
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 chrome-btn font-cyber font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[3]" />
            <span>Download Original File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
