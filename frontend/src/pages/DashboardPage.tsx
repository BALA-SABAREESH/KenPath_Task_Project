import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Reading, ReportData, TIME_SLOTS } from '../types';
import { readingsApi, reportsApi, systemApi } from '../services/api';
import { formatDateDisplay, getTodayDateString, getGlucoseCategory } from '../utils/glucose';
import { StatCard } from '../components/StatCard';
import { GlucoseBadge } from '../components/GlucoseBadge';
import { TrendChart } from '../components/TrendChart';
import { ReadingModal } from '../components/ReadingModal';
import { DatabaseModal } from '../components/DatabaseModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const today = getTodayDateString();

  const [dailyReport, setDailyReport] = useState<ReportData | null>(null);
  const [recentReadings, setRecentReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [dbProvider, setDbProvider] = useState<string>('Neon PostgreSQL');
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [todayRep, allList, dbStatus] = await Promise.all([
        reportsApi.getDaily(today).catch(() => null),
        readingsApi.getAll().catch(() => []),
        systemApi.getStatus().catch(() => null),
      ]);

      if (todayRep) setDailyReport(todayRep);
      if (allList) setRecentReadings(allList.slice(0, 8));
      if (dbStatus) {
        setDbProvider(dbStatus.provider);
        setIsConnected(dbStatus.connected);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Listen for cross-component reading saved event
    const handleRefresh = () => {
      loadDashboardData();
    };
    window.addEventListener('sweety:reading-saved', handleRefresh);
    return () => window.removeEventListener('sweety:reading-saved', handleRefresh);
  }, []);

  const todayCount = dailyReport?.statistics.totalReadings || 0;
  const loggedSlots = new Set(dailyReport?.readings.map((r) => r.time_slot) || []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Greeting & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>{formatDateDisplay(today)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Good day, {user?.name?.split(' ')[0] || 'Patient'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here is your daily blood glucose overview and clinical slot progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-xs hover:shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log Reading</span>
          </button>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
          >
            <span>View Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Daily Slot Progress Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Today's Slots Progress
            </span>
          </div>
          <span className="text-xs font-semibold text-purple-900">
            {todayCount} of 4 Logged
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TIME_SLOTS.map((slot) => {
            const isLogged = loggedSlots.has(slot);
            const slotReading = dailyReport?.readings.find((r) => r.time_slot === slot);
            return (
              <div
                key={slot}
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  isLogged
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-200 bg-slate-50/50 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold truncate">{slot}</span>
                  {isLogged ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                  )}
                </div>
                {slotReading ? (
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-base font-bold text-slate-900 tabular-nums">
                      {slotReading.glucose_value}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">mg/dl</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">Pending</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Today's Average"
          value={dailyReport?.statistics.average ?? null}
          subtext={todayCount > 0 ? `${todayCount} reading(s) recorded` : 'No readings today'}
          icon={<Activity className="w-4 h-4" />}
          variant="highlight"
        />
        <StatCard
          label="Highest Today"
          value={dailyReport?.statistics.highest ?? null}
          subtext="Daily peak level"
          icon={<TrendingUp className="w-4 h-4 text-rose-500" />}
        />
        <StatCard
          label="Lowest Today"
          value={dailyReport?.statistics.lowest ?? null}
          subtext="Daily trough level"
          icon={<TrendingDown className="w-4 h-4 text-emerald-500" />}
        />
        <StatCard
          label="Readings Today"
          value={todayCount}
          unit="logged"
          subtext={todayCount < 4 ? `${4 - todayCount} slot(s) remaining` : 'Daily limit reached'}
          icon={<Clock className="w-4 h-4 text-purple-600" />}
        />
      </div>

      {/* Main Grid: Trend Chart & Recent Readings */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Recharts Trend Graph */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Glucose Trajectory</h3>
              <p className="text-xs text-slate-500">Historical glycemic readings vs 70–140 mg/dl normal band</p>
            </div>
            <Link
              to="/reports"
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <TrendChart readings={recentReadings} height={260} />
        </div>

        {/* Right Column: Recent Readings Quick Feed */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Readings</h3>
              <p className="text-xs text-slate-500">Latest recorded measurements</p>
            </div>
            <Link
              to="/readings"
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[300px]">
            {recentReadings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <Activity className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No readings found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "Log Reading" above to record your first entry</p>
              </div>
            ) : (
              recentReadings.slice(0, 5).map((reading) => (
                <div
                  key={reading.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-purple-50/30 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-900">{reading.time_slot}</p>
                    <p className="text-[11px] text-slate-500">{formatDateDisplay(reading.reading_date)}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <GlucoseBadge value={reading.glucose_value} slot={reading.time_slot} />
                    <span className="text-base font-bold text-slate-900 tabular-nums">
                      {reading.glucose_value}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ReadingModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSaved={loadDashboardData}
      />

      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onStatusChange={(st) => {
          setDbProvider(st.provider);
          setIsConnected(st.connected);
        }}
      />
    </div>
  );
};
