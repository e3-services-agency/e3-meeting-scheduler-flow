import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  confirmButtonVariant?: 'default' | 'destructive';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  confirmButtonVariant = 'default'
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-e3-space-blue border border-e3-white/20 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-e3-flame" />
            <h3 className="text-lg font-semibold text-e3-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-e3-white/60 hover:text-e3-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-e3-white/80 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-e3-white/80 hover:text-e3-white transition border border-e3-white/20 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition ${
              confirmButtonVariant === 'destructive'
                ? 'bg-e3-flame text-white hover:bg-e3-flame/90'
                : 'bg-e3-emerald text-e3-space-blue hover:bg-e3-emerald/90'
            }`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};