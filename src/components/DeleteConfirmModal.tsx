import React from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  fileName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  fileName,
  isDeleting,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-zinc-950 rounded-2xl border border-white/30 max-w-md w-full p-6 shadow-[0_0_35px_rgba(255,255,255,0.15)] cyber-panel space-y-4 text-white">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/40 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-cyber text-base font-bold text-white tracking-wide">
              CONFIRM_FILE_PURGE.EXE
            </h3>
            <p className="text-xs font-mono text-zinc-300 mt-1">
              Are you sure you want to permanently purge <span className="font-bold text-white truncate inline-block max-w-[220px] align-bottom">"{fileName}"</span> from the vault sector?
            </p>
            <p className="text-[11px] font-mono text-zinc-400 mt-1">
              // WARNING: Physical sectors on disk will be unlinked. Zero recovery possible.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10 font-tech">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
          >
            [ CANCEL ]
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-cyber font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>PURGING...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>EXECUTE PURGE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
