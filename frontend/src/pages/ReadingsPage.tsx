import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Edit2,
  Trash2,
  ArrowUpDown,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { Reading, TimeSlot } from '../types';
import { readingsApi } from '../services/api';
import { formatDateDisplay, getTodayDateString } from '../utils/glucose';
import { GlucoseBadge } from '../components/GlucoseBadge';
import { ReadingModal } from '../components/ReadingModal';
import { DeleteModal } from '../components/DeleteModal';

export const ReadingsPage: React.FC = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPreset, setFilterPreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [deletingReading, setDeletingReading] = useState<Reading | null>(null);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      let params: { date?: string; startDate?: string; endDate?: string } = {};

      const today = getTodayDateString();

      if (filterPreset === 'today') {
        params.date = today;
      } else if (filterPreset === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.startDate = d.toISOString().split('T')[0];
        params.endDate = today;
      } else if (filterPreset === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        params.startDate = d.toISOString().split('T')[0];
        params.endDate = today;
      } else if (filterPreset === 'custom' && customDate) {
        params.date = customDate;
      }

      const list = await readingsApi.getAll(params);
      setReadings(list);
    } catch {
      setReadings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [filterPreset, customDate]);

  const handleOpenAdd = () => {
    setEditingReading(null);
    setIsReadingModalOpen(true);
  };

  const handleOpenEdit = (reading: Reading) => {
    setEditingReading(reading);
    setIsReadingModalOpen(true);
  };

  const handleSaved = (reading: Reading) => {
    fetchReadings();
  };

  const handleDeleted = (id: string) => {
    setReadings((prev) => prev.filter((r) => r.id !== id));
  };

  // Client-side slot / search filter
  const filteredReadings = readings.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.time_slot.toLowerCase().includes(term) ||
      r.reading_date.includes(term) ||
      String(r.glucose_value).includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Readings History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete record of blood glucose readings with clinical categorization
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-xs hover:shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reading</span>
        </button>
      </div>

      {/* Filter Toolbar (§1.A Segmented Controls) */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl overflow-x-auto">
            <button
              onClick={() => setFilterPreset('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                filterPreset === 'all'
                  ? 'bg-white text-purple-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setFilterPreset('today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                filterPreset === 'today'
                  ? 'bg-white text-purple-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilterPreset('7days')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                filterPreset === '7days'
                  ? 'bg-white text-purple-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setFilterPreset('30days')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                filterPreset === '30days'
                  ? 'bg-white text-purple-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setFilterPreset('custom')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                filterPreset === 'custom'
                  ? 'bg-white text-purple-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Date
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search date or slot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 pl-8 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {filterPreset === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Select specific date:</span>
            <input
              type="date"
              max={getTodayDateString()}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-3 py-1 text-xs rounded-lg border border-slate-300 font-medium"
            />
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 mx-auto border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">Loading clinical records...</p>
          </div>
        ) : filteredReadings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">No readings found</h3>
              <p className="text-xs text-slate-500 mt-1">
                {filterPreset !== 'all'
                  ? 'No readings match your selected date filter.'
                  : 'Start by recording your first glucose reading.'}
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log First Entry</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Time Slot
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Value (mg/dl)
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Clinical Classification
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReadings.map((reading) => (
                  <tr
                    key={reading.id}
                    className="hover:bg-purple-50/30 transition-colors group"
                  >
                    <td className="px-6 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                      {formatDateDisplay(reading.reading_date)}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 whitespace-nowrap font-medium">
                      {reading.time_slot}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900 tabular-nums whitespace-nowrap text-sm">
                      {reading.glucose_value}{' '}
                      <span className="text-[11px] font-normal text-slate-400">mg/dl</span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <GlucoseBadge
                        value={reading.glucose_value}
                        slot={reading.time_slot}
                        showDetails
                      />
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(reading)}
                          title="Edit reading"
                          className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingReading(reading)}
                          title="Delete reading"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer with count (§1.A Zero-pill discipline) */}
        <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing <strong className="text-slate-900">{filteredReadings.length}</strong> of{' '}
            <strong className="text-slate-900">{readings.length}</strong> total records
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Sorted by Date (Newest first)
          </span>
        </div>
      </div>

      <ReadingModal
        isOpen={isReadingModalOpen}
        onClose={() => setIsReadingModalOpen(false)}
        onSaved={handleSaved}
        editingReading={editingReading}
      />

      <DeleteModal
        isOpen={!!deletingReading}
        onClose={() => setDeletingReading(null)}
        onDeleted={handleDeleted}
        reading={deletingReading}
      />
    </div>
  );
};
