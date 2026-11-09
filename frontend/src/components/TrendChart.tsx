import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { Reading } from '../types';
import { formatShortDate, getGlucoseCategory } from '../utils/glucose';

interface TrendChartProps {
  readings: Reading[];
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ readings, height = 280 }) => {
  if (!readings || readings.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center"
      >
        <p className="text-xs font-semibold text-slate-500">No chart data available for this range</p>
        <p className="text-[11px] text-slate-400 mt-1">Log readings to view interactive glucose trends</p>
      </div>
    );
  }

  // Sort chronological for chart
  const sorted = [...readings].sort((a, b) => {
    if (a.reading_date !== b.reading_date) {
      return a.reading_date.localeCompare(b.reading_date);
    }
    const order: Record<string, number> = {
      'Morning (fasting)': 1,
      'After breakfast': 2,
      'After lunch': 3,
      'After dinner': 4,
    };
    return (order[a.time_slot] || 0) - (order[b.time_slot] || 0);
  });

  const chartData = sorted.map((r, idx) => ({
    id: r.id,
    index: idx + 1,
    date: r.reading_date,
    shortDate: formatShortDate(r.reading_date),
    slot: r.time_slot,
    value: r.glucose_value,
    fullRecord: r,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const cat = getGlucoseCategory(data.value, data.slot);
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between gap-4 font-semibold text-slate-900">
            <span>{data.date}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${cat.bgColor} ${cat.textColor}`}>
              {cat.label}
            </span>
          </div>
          <div className="text-slate-500">{data.slot}</div>
          <div className="text-sm font-bold text-purple-900 tabular-nums">
            {data.value} <span className="text-xs font-medium text-slate-400">mg/dl</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">Glucose Trajectory</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-400" />
            <span className="text-[11px]">Normal Target (70–140 mg/dl)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span className="text-[11px]">Patient Reading</span>
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="shortDate"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              domain={[40, (dataMax: number) => Math.max(200, Math.ceil((dataMax + 20) / 20) * 20)]}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
              className="tabular-nums"
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Highlight normal clinical target zone 70-140 mg/dl */}
            <ReferenceArea y1={70} y2={140} fill="#ecfdf5" fillOpacity={0.6} />
            <ReferenceLine y={140} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6b21a8"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#purpleGradient)"
              activeDot={{ r: 6, fill: '#6b21a8', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
