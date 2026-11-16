import React from 'react';
import { Loader2, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemType: 'workout' | 'meal';
  title: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  itemType,
  title,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="bg-[#FFFFFF] border border-[#0A0A0A] rounded-[2px] max-w-md w-full p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E5E5] pb-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#737373]">
              Confirm Deletion
            </p>
            <h3 id="delete-dialog-title" className="text-base font-bold text-[#0A0A0A] mt-0.5">
              Delete this {itemType}?
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="Close dialog"
            className="p-1 text-[#737373] hover:text-[#0A0A0A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-[#555555] leading-relaxed">
          You are about to permanently remove{' '}
          <span className="font-semibold text-[#0A0A0A]">&ldquo;{title}&rdquo;</span> from your
          training logbook. This action cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-[#FFFFFF] text-[#0A0A0A] text-xs font-medium rounded-[2px] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
