import React, { useState, useRef } from 'react';
import { UploadCloud, FileCheck, AlertCircle, X, Loader2, Zap, Terminal } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import type { VaultFile } from '../types';

interface FileUploadAreaProps {
  onUploadSuccess: (newFiles: VaultFile[]) => void;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onUploadSuccess,
  isOpenModal = false,
  onCloseModal
}) => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<'Deliverable' | 'Design' | 'Image' | 'Document'>('Deliverable');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    setError(null);
    setSuccessMessage(null);
    const validFiles = files.filter(f => f.size <= 50 * 1024 * 1024);
    if (validFiles.length < files.length) {
      setError('System notice: Some files exceeded the 50MB per-file upload limit.');
    }
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !token) return;

    setIsUploading(true);
    setUploadProgress(20);
    setError(null);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('category', category);
    if (notes) {
      formData.append('notes', notes);
    }

    try {
      const timer = setInterval(() => {
        setUploadProgress(p => (p < 85 ? p + 15 : p));
      }, 150);

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(timer);
      setUploadProgress(100);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload files to vault.');
      }

      setSuccessMessage(data.message || 'Files securely committed to vault storage.');
      onUploadSuccess(data.files || []);

      setTimeout(() => {
        setSelectedFiles([]);
        setNotes('');
        setUploadProgress(0);
        setIsUploading(false);
        if (onCloseModal) {
          onCloseModal();
        }
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Error occurred during data transfer.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  const content = (
    <div className="space-y-4 text-white">
      {/* Monochromatic Cyber Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-7 text-center transition-all cyber-card ${
          isDragging
            ? 'border-white bg-zinc-900/70 shadow-[0_0_25px_rgba(255,255,255,0.25)] scale-[1.01]'
            : 'border-white/20 hover:border-white/50 bg-zinc-950/80 hover:bg-zinc-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Decorative monochromatic cyber corner ticks */}
        <div className="absolute top-2 left-2 text-[10px] font-mono text-zinc-500">[+DATA_INPUT+]</div>
        <div className="absolute top-2 right-2 text-[10px] font-mono text-zinc-500">SEC_PORT:2000</div>

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/30 text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            <UploadCloud className="w-7 h-7 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
          </div>
          <div>
            <p className="font-cyber text-sm font-bold text-white tracking-wide">
              DROP FILES HERE OR <span className="text-white underline underline-offset-4 decoration-white">BROWSE DISK</span>
            </p>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Supports Figma archives, PSDs, PDFs, 3D assets, images, and deliverables up to 50MB
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files Staging List */}
      {selectedFiles.length > 0 && (
        <div className="p-4 bg-zinc-950 rounded-xl border border-white/20 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
            <span className="font-cyber flex items-center gap-1.5 text-white">
              <Terminal className="w-3.5 h-3.5 text-white" />
              QUEUED_ITEMS ({selectedFiles.length})
            </span>
            <span className="tabular-nums text-zinc-400">{formatFileSize(totalSize)}</span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between px-3 py-2 bg-zinc-900 rounded-lg border border-white/10 text-zinc-200"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-white shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-zinc-500 tabular-nums shrink-0">({formatFileSize(file.size)})</span>
                </div>
                {!isUploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="text-zinc-500 hover:text-white p-1"
                    aria-label="Remove File"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Optional Category & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
            <div>
              <label className="block text-[11px] font-mono text-zinc-300 mb-1">
                CATEGORY_TAG
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs font-mono py-1.5 px-2.5 bg-zinc-900 text-white border border-white/20 rounded-lg focus:outline-none focus:border-white"
              >
                <option value="Deliverable">Deliverable Package</option>
                <option value="Design">Design File / PSD / Figma</option>
                <option value="Image">Image Asset</option>
                <option value="Document">Contract / Spec Document</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-300 mb-1">
                CLIENT_NOTE (OPTIONAL)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Approved brand assets revision v2.0"
                className="w-full text-xs font-mono py-1.5 px-2.5 bg-zinc-900 text-white border border-white/20 rounded-lg focus:outline-none focus:border-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-1 pt-1 font-mono">
              <div className="flex justify-between text-[11px] text-zinc-300">
                <span>ENCRYPTING & UPLOADING TO VAULT...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-white/20">
                <div
                  className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-white h-full transition-all duration-200 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end gap-2 pt-1 font-tech">
            <button
              onClick={() => setSelectedFiles([])}
              disabled={isUploading}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white disabled:opacity-50"
            >
              Clear Queue
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-2 chrome-btn font-cyber font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Committing Data...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Confirm Upload ({selectedFiles.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="p-3 bg-zinc-900 border border-white/30 rounded-xl text-xs font-mono text-zinc-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-white" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-zinc-900 border border-white/30 rounded-xl text-xs font-mono text-zinc-200 flex items-center gap-2">
          <FileCheck className="w-4 h-4 shrink-0 text-white" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );

  if (isOpenModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
        <div className="bg-zinc-950 rounded-2xl border border-white/20 max-w-xl w-full p-6 shadow-[0_0_40px_rgba(255,255,255,0.15)] cyber-panel space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="font-cyber text-base font-bold text-white neon-glow-silver">
                COMMIT FILES TO SUVAULT
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Secure 256-bit isolated partition upload
              </p>
            </div>
            <button
              onClick={onCloseModal}
              className="text-zinc-400 hover:text-white p-1 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
};
