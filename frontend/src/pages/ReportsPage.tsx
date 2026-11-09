import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  FileSpreadsheet,
  Download,
  AlertCircle,
} from 'lucide-react';
import { ReportData } from '../types';
import { reportsApi } from '../services/api';
import { formatDateDisplay, getTodayDateString, getGlucoseCategory } from '../utils/glucose';
import { StatCard } from '../components/StatCard';
import { TrendChart } from '../components/TrendChart';
import { GlucoseBadge } from '../components/GlucoseBadge';

export const ReportsPage: React.FC = () => {
  const today = getTodayDateString();

  const [activeTab, setActiveTab] = useState<'daily' | 'month-to-date' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let data: ReportData;
      if (activeTab === 'daily') {
        data = await reportsApi.getDaily(selectedDate);
      } else if (activeTab === 'month-to-date') {
        data = await reportsApi.getMonthToDate(selectedDate);
      } else {
        data = await reportsApi.getMonthly(selectedDate);
      }
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, selectedDate]);

  const handleDownloadExcel = () => {
    if (!report) return;

    // Create a new Excel workbook
    const wb = XLSX.utils.book_new();

    const reportTypeName =
      activeTab === 'daily'
        ? 'Daily Glucose Report'
        : activeTab === 'month-to-date'
        ? 'Month-to-Date Glucose Report'
        : 'Previous Month Glucose Report';

    // Sheet 1: Clinical Summary
    const summaryData = [
      ['SWEETY – BLOOD GLUCOSE TRACKER'],
      ['Clinical Analytics & Report Summary'],
      [],
      ['Report Type', reportTypeName],
      ['Selected Horizon Date', report.targetDate],
      ['Period Start Date', report.startDate],
      ['Period End Date', report.endDate],
      ['Generated On', new Date().toLocaleString()],
      [],
      ['KEY CLINICAL STATISTICS'],
      ['Total Readings Recorded', report.statistics.totalReadings],
      ['Highest Glucose Reading (mg/dl)', report.statistics.highest ?? 'N/A'],
      ['Lowest Glucose Reading (mg/dl)', report.statistics.lowest ?? 'N/A'],
      ['Average Glucose Reading (mg/dl)', report.statistics.average ?? 'N/A'],
      [],
      ['ADA CLINICAL REFERENCE TARGETS'],
      ['Morning (fasting)', '70 – 99 mg/dl (Normal target)'],
      ['Post-Prandial (After breakfast / lunch / dinner)', '70 – 139 mg/dl (Optimal post-meal target)'],
      ['Hypoglycemia Alert Threshold', '< 70 mg/dl'],
      ['Hyperglycemia Spike Threshold', '≥ 180 mg/dl'],
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 32 }, { wch: 55 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Clinical Summary');

    // Sheet 2: Detailed Readings Data
    const readingsRows = (report.readings || []).map((r, index) => {
      const cat = getGlucoseCategory(r.glucose_value, r.time_slot);
      return {
        'Index': index + 1,
        'Date': r.reading_date,
        'Clinical Time Slot': r.time_slot,
        'Glucose Value (mg/dl)': r.glucose_value,
        'Clinical Status': cat.label,
        'ADA Classification Note': cat.description,
        'Record Timestamp': new Date(r.created_at).toLocaleString(),
      };
    });

    const readingsWs =
      readingsRows.length > 0
        ? XLSX.utils.json_to_sheet(readingsRows)
        : XLSX.utils.aoa_to_sheet([['No blood glucose readings were recorded for this selected period.']]);

    readingsWs['!cols'] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
      { wch: 16 },
      { wch: 42 },
      { wch: 24 },
    ];

    XLSX.utils.book_append_sheet(wb, readingsWs, 'Readings Data');

    // Generate clean file name e.g. Sweety_Daily_Report_2026-11-09.xlsx
    const cleanType = activeTab.replace(/-/g, '_');
    const filename = `Sweety_${cleanType}_Report_${report.targetDate}.xlsx`;

    XLSX.writeFile(wb, filename);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Clinical Glucose Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Aggregated statistics and trends computed directly from Neon PostgreSQL records
          </p>
        </div>

        {/* Action Controls: Date Selector + Download Excel Button */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <Calendar className="w-4 h-4 text-purple-600 ml-2" />
            <input
              type="date"
              max={today}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
            />
          </div>

          {/* Download in Excel Sheet Button */}
          <button
            onClick={handleDownloadExcel}
            disabled={loading || !report}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition-all shadow-xs hover:shadow-sm"
            title="Download full analyzed report in Excel spreadsheet format (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{downloadSuccess ? 'Downloaded!' : 'Download Excel Report (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Report Type Tabs (§1.A Segmented Buttons) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'daily'
              ? 'bg-white text-purple-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily Report
        </button>
        <button
          onClick={() => setActiveTab('month-to-date')}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'month-to-date'
              ? 'bg-white text-purple-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Month-to-Date
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'monthly'
              ? 'bg-white text-purple-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Previous Month
        </button>
      </div>

      {/* Scope Banner */}
      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-semibold text-purple-950">
            {activeTab === 'daily' && `Daily Horizon: ${formatDateDisplay(report?.targetDate || selectedDate)}`}
            {activeTab === 'month-to-date' &&
              `Month-to-Date: ${formatDateDisplay(report?.startDate || selectedDate)} through ${formatDateDisplay(report?.endDate || selectedDate)}`}
            {activeTab === 'monthly' &&
              `Full Previous Calendar Month: ${formatDateDisplay(report?.startDate || '')} to ${formatDateDisplay(report?.endDate || '')}`}
          </span>
          <p className="text-purple-700/80 mt-0.5">
            {activeTab === 'daily' && 'Evaluates up to 4 clinical slots logged for this single calendar day.'}
            {activeTab === 'month-to-date' && 'Shows month-level adherence and trajectory up to the chosen date.'}
            {activeTab === 'monthly' && 'Historical benchmark of the entire preceding calendar month.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="font-bold text-purple-900 tabular-nums">
              {report?.statistics.totalReadings ?? 0}
            </span>{' '}
            <span className="text-purple-700">readings analyzed</span>
          </div>

          <button
            onClick={handleDownloadExcel}
            disabled={loading || !report}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 rounded-lg transition-colors border border-emerald-200"
            title="Download Excel spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* Key Statistics KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Highest Reading"
          value={report?.statistics.highest ?? null}
          subtext="Peak clinical glucose"
          icon={<TrendingUp className="w-4 h-4 text-rose-500" />}
        />
        <StatCard
          label="Lowest Reading"
          value={report?.statistics.lowest ?? null}
          subtext="Trough clinical glucose"
          icon={<TrendingDown className="w-4 h-4 text-emerald-500" />}
        />
        <StatCard
          label="Average Reading"
          value={report?.statistics.average ?? null}
          subtext="Rounded to one decimal"
          icon={<Activity className="w-4 h-4 text-purple-600" />}
          variant="highlight"
        />
        <StatCard
          label="Total Readings"
          value={report?.statistics.totalReadings ?? 0}
          unit="logged"
          subtext="Valid entries in period"
          icon={<CheckCircle className="w-4 h-4 text-purple-600" />}
        />
      </div>

      {/* Visual Chart Section */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Glycemic Trajectory</h3>
          <p className="text-xs text-slate-500">
            Chronological trend graph with ADA target band (70–140 mg/dl)
          </p>
        </div>
        <TrendChart readings={report?.readings || []} height={280} />
      </div>

      {/* Readings Breakdown / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {activeTab === 'daily' ? 'Individual Daily Readings & Slots' : 'Period Reading Breakdown'}
            </h3>
            <p className="text-xs text-slate-500">Detailed list of recorded measurements</p>
          </div>

          {report && report.readings.length > 0 && (
            <button
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Sheet</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-6 h-6 mx-auto border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs">Computing report...</p>
          </div>
        ) : !report?.readings || report.readings.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-xs font-semibold text-slate-800">No readings found for this timeframe</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              There are no recorded measurements for {selectedDate}. Choose another date or add readings from your dashboard.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Time Slot
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Glucose Value
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.readings.map((r) => (
                  <tr key={r.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {formatDateDisplay(r.reading_date)}
                    </td>
                    <td className="px-6 py-3 text-slate-700 whitespace-nowrap font-medium">
                      {r.time_slot}
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      {r.glucose_value} mg/dl
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <GlucoseBadge value={r.glucose_value} slot={r.time_slot} showDetails />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
