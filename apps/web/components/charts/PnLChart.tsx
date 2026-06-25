'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PnlDataPoint {
  timestamp: string;
  totalValue: string;
  totalPnl: string;
  apr?: string;
}

interface PnLChartProps {
  data: PnlDataPoint[];
  height?: number;
  showApr?: boolean;
}

export function PnLChart({ data, height = 300, showApr = false }: PnLChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      date: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseFloat(d.totalValue),
      pnl: parseFloat(d.totalPnl),
      apr: d.apr ? parseFloat(d.apr) * 100 : 0,
    }));
  }, [data]);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#475569"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#475569"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === 'value' ? 'TVL' : name === 'pnl' ? 'PnL' : 'APR %',
            ]}
          />
          <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#06b6d4"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
            name="value"
          />
          {showApr && (
            <Area
              type="monotone"
              dataKey="apr"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={0}
              fill="none"
              name="apr"
              yAxisId={1}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
  }
