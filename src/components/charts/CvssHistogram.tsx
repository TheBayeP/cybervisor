'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface CvssData {
  range: string;
  count: number;
}

interface CvssHistogramProps {
  data: CvssData[];
  className?: string;
}

/** Map CVSS range buckets to severity-aligned colors */
function barColor(range: string): string {
  const start = parseFloat(range);
  if (start >= 9) return '#dc2626'; // critical
  if (start >= 7) return '#ea580c'; // high
  if (start >= 4) return '#eab308'; // medium
  if (start >= 0.1) return '#22c55e'; // low
  return '#3b82f6'; // info / none
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        CVSS {label}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {payload[0].value} CVEs
      </p>
    </div>
  );
}

const DEFAULT_RANGES = [
  '0-1',
  '1-2',
  '2-3',
  '3-4',
  '4-5',
  '5-6',
  '6-7',
  '7-8',
  '8-9',
  '9-10',
];

export function CvssHistogram({ data, className }: CvssHistogramProps) {
  const chartData = useMemo(() => {
    if (data.length > 0) return data;
    return DEFAULT_RANGES.map((range) => ({ range, count: 0 }));
  }, [data]);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
          />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14,165,233,0.08)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {chartData.map((entry) => (
              <Cell key={entry.range} fill={barColor(entry.range)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
