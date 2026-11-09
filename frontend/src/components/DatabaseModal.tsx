import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, RefreshCw, X, Server, KeyRound, ExternalLink } from 'lucide-react';
import { DBStatus } from '../types';
import { systemApi } from '../services/api';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: DBStatus) => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose, onStatusChange }) => {
  const [status, setStatus] = useState<DBStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await systemApi.getStatus();
      setStatus(data);
      if (onStatusChange) onStatusChange(data);
    } catch {
      setActionMessage({ text: 'Unable to retrieve database status.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setActionMessage(null);
    }
  }, [isOpen]);

  const handleApplyUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    setIsUpdating(true);
    setActionMessage(null);

    try {
      const res = await systemApi.configureDb(customUrl.trim());
      setStatus(res.database);
      if (onStatusChange) onStatusChange(res.database);
      setActionMessage({ text: res.message || 'Successfully connected to Neon PostgreSQL!', isError: false });
      setCustomUrl('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to connect to Neon PostgreSQL.';
      setActionMessage({ text: msg, isError: true });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Database Connection</h3>
              <p className="text-xs text-slate-500">Neon PostgreSQL Serverless Architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Box */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Provider</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-900">
                <Server className="w-3.5 h-3.5 text-purple-600" />
                {status?.provider || 'Neon PostgreSQL'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Connection</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                  status?.connected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {status?.connected ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Connected (SSL Active)
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Resilient Local Mode
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Host</span>
              <span className="text-xs font-mono text-slate-700 truncate max-w-[240px]">
                {status?.host || 'ep-quiet-fire-*.neon.tech'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 leading-relaxed">
              {status?.message}
            </div>
          </div>

          {actionMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                actionMessage.isError
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              {actionMessage.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* Connect Live Neon Database Form */}
          <form onSubmit={handleApplyUrl} className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Connect your Neon PostgreSQL Connection String:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="postgresql://neondb_owner:***@ep-*.neon.tech/neondb?sslmode=require"
                  className="w-full px-3 py-2 pl-9 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-500">
                Or configure <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">DATABASE_URL</code> in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">backend/.env</code>.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={fetchStatus}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </button>
              <button
                type="submit"
                disabled={isUpdating || !customUrl.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
              >
                {isUpdating ? 'Testing Connection...' : 'Connect to Neon'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Project: Glucose Tracker · neondb</span>
          <a
            href="https://neon.tech"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800"
          >
            Neon Console <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
