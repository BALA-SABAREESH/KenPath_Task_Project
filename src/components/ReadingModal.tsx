import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Activity, AlertCircle } from 'lucide-react';
import { Reading, TimeSlot, TIME_SLOTS } from '../types';
import { getTodayDateString, getGlucoseCategory } from '../utils/glucose';
import { readingsApi } from '../services/api';

interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (reading: Reading) => void;
  editingReading?: Reading | null;
}

export const ReadingModal: React.FC<ReadingModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingReading,
}) => {
  const today = getTodayDateString();

  const [date, setDate] = useState<string>(today);
  const [slot, setSlot] = useState<TimeSlot>('Morning (fasting)');
  const [value, setValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingReading) {
      setDate(editingReading.reading_date);
      setSlot(editingReading.time_slot);
      setValue(String(editingReading.glucose_value));
    } else {
      setDate(today);
      setSlot('Morning (fasting)');
      setValue('');
    }
    setError(null);
  }, [editingReading, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Rule 1: Value is required
    if (!value || value.trim() === '') {
      setError('Please enter a glucose value.');
      return;
    }

    // Rule 2 & decimal check: whole number between 40 and 600
    if (value.includes('.')) {
      setError('Value must be between 40 and 600 mg/dl.');
      return;
    }

    const numVal = parseInt(value, 10);
    if (isNaN(numVal) || numVal < 40 || numVal > 600) {
      setError('Value must be between 40 and 600 mg/dl.');
      return;
    }

    // Rule 5: Date cannot be in the future
    if (date > today) {
      setError('Date cannot be in the future.');
      return;
    }

    setSubmitting(true);
    try {
      let savedReading: Reading;
      if (editingReading) {
        savedReading = await readingsApi.update(editingReading.id, {
          reading_date: date,
          time_slot: slot,
          glucose_value: numVal,
        });
      } else {
        savedReading = await readingsApi.create({
          reading_date: date,
          time_slot: slot,
          glucose_value: numVal,
        });
      }
      onSaved(savedReading);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save glucose reading.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const previewVal = parseInt(value, 10);
  const previewCategory = !isNaN(previewVal) && previewVal >= 40 && previewVal <= 600 && !value.includes('.')
    ? getGlucoseCategory(previewVal, slot)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-purple-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {editingReading ? 'Edit Glucose Reading' : 'Log Blood Glucose'}
              </h3>
              <p className="text-xs text-slate-500">Record clinical measurement (mg/dl)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                max={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                required
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-400">Date cannot be in the future.</p>
          </div>

          {/* Time Slot Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Time Slot
            </label>
            <div className="relative">
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value as TimeSlot)}
                className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none font-medium bg-white"
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-400">One reading permitted per slot per day (max 4/day).</p>
          </div>

          {/* Glucose Value Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Glucose Value (mg/dl)
              </label>
              {previewCategory && (
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${previewCategory.bgColor} ${previewCategory.textColor} ${previewCategory.borderColor}`}>
                  {previewCategory.label}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min="40"
                max="600"
                step="1"
                placeholder="e.g. 110"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2.5 text-lg font-bold tabular-nums rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <span className="absolute right-3 top-3 text-xs font-semibold text-slate-400">
                mg/dl
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Must be a whole number between 40 and 600.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
            >
              {submitting ? 'Saving...' : editingReading ? 'Update Reading' : 'Save Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
