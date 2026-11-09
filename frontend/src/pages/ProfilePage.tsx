import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, LogOut, Database, Shield, Server, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { systemApi, readingsApi } from '../services/api';
import { DBStatus } from '../types';
import { DatabaseModal } from '../components/DatabaseModal';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [totalReadings, setTotalReadings] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      const [readings, status] = await Promise.all([
        readingsApi.getAll().catch(() => []),
        systemApi.getStatus().catch(() => null),
      ]);
      setTotalReadings(readings.length);
      if (status) setDbStatus(status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Patient Account & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your personal profile and inspect Neon PostgreSQL connection details
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-700 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-purple-900/10">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Total Logged Readings
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totalReadings !== null ? totalReadings : '—'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Historical entries in database</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Account Status
            </span>
            <p className="text-base font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Verified Patient</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">JWT session active</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Security Standard
            </span>
            <p className="text-base font-bold text-slate-900 mt-1">
              bcrypt (10 rounds)
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Encrypted password hashing</p>
          </div>
        </div>
      </div>

      {/* Database Architecture & Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Neon PostgreSQL Database Engine
              </h3>
              <p className="text-xs text-slate-500">
                Cloud database provider and connection state
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDbModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
          >
            Configure Connection
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Database Engine:</span>
            <span className="font-semibold text-slate-900">
              {dbStatus?.provider || 'Neon Serverless PostgreSQL'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Database Name:</span>
            <span className="font-semibold text-slate-900">neondb</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">SSL Encryption:</span>
            <span className="font-semibold text-emerald-700">Required (rejectUnauthorized: false)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Current Host:</span>
            <span className="font-mono text-slate-800">{dbStatus?.host || 'Local Resilient Mode'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Connection State:</span>
            <span
              className={`font-semibold ${
                dbStatus?.connected ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {dbStatus?.connected ? 'Online (Connected)' : 'Local Resilient Fallback Active'}
            </span>
          </div>
        </div>

        <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-[11px] text-purple-900/90 leading-relaxed">
          {dbStatus?.message}
        </div>
      </div>

      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onStatusChange={(status) => setDbStatus(status)}
      />
    </div>
  );
};
