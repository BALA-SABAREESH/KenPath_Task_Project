import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Reading } from '../types';
import { formatDateDisplay } from '../utils/glucose';
import { readingsApi } from '../services/api';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
  reading: Reading | null;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onDeleted,
  reading,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !reading) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await readingsApi.delete(reading.id);
      onDeleted(reading.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete reading.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">Delete Reading?</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently remove this record? This action cannot be undone.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Date:</span>
              <span className="font-semibold text-slate-900">{formatDateDisplay(reading.reading_date)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Slot:</span>
              <span className="font-semibold text-slate-900">{reading.time_slot}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Value:</span>
              <span className="font-bold text-slate-900 tabular-nums">{reading.glucose_value} mg/dl</span>
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="w-1/2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
