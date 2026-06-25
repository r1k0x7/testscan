'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Position {
  coin: string;
  szi: string;
  leverage: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  liquidationPx: string | null;
}

interface AddressData {
  address: string;
  alias: string | null;
  isWhale: boolean;
  firstSeen: string;
  lastSeen: string;
  totalTxCount: number;
  positions: {
    accountValue: number;
    totalMargin: number;
    withdrawable: string;
    positions: Position[];
  } | null;
  recentTransactions: Array<{
    hash: string;
    from: string;
    to: string | null;
    value: string;
    status: string;
    type: string | null;
    timestamp: string;
  }>;
  whaleActivities: Array<{
    type: string;
    asset: string;
    amountUsd: string;
    timestamp: string;
  }>;
}

export default function AddressPage() {
  const params = useParams();
  const address = params.address as string;
  const [data, setData] = useState<AddressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'history'>('overview');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchAddressData();
  }, [address]);

  async function fetchAddressData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/addresses/${address}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch address:', err);
    } finally {
      setLoading(false);
    }
  }

  const truncate = (str: string, start = 6, end = 4) =>
    `${str.slice(0, start)}...${str.slice(-end)}`;

  const formatUsd = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Address Not Found</h2>
          <p className="text-slate-400">{address}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Address Header */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold font-mono">
                  {data.alias || truncate(data.address, 8, 6)}
                </h1>
                <p className="text-sm text-slate-400 font-mono">{data.address}</p>
              </div>
            </div>
            {data.isWhale && (
              <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <span className="text-lg">🐋</span> Whale
              </span>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox
              label="Account Value"
              value={data.positions ? formatUsd(data.positions.accountValue) : '-'}
              color="cyan"
            />
            <StatBox
              label="Margin Used"
              value={data.positions ? formatUsd(data.positions.totalMargin) : '-'}
              color="blue"
            />
            <StatBox
              label="Positions"
              value={data.positions?.positions?.length?.toString() || '0'}
              color="emerald"
            />
            <StatBox
              label="Total Txs"
              value={data.totalTxCount.toString()}
              color="purple"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-900/50 p-1 rounded-lg border border-slate-800 w-fit">
          {(['overview', 'positions', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Activity */}
            <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <h2 className="font-semibold">Recent Activity</h2>
              </div>
              <div className="divide-y divide-slate-800/50">
                {data.recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.hash} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link href={`/tx/${tx.hash}`} className="text-cyan-400 hover:text-cyan-300 font-mono text-sm">
                          {truncate(tx.hash)}
                        </Link>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${
                          tx.type?.includes('buy') || tx.type?.includes('long')
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}>
                          {tx.type || 'Transfer'}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          ${parseFloat(tx.value).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {data.recentTransactions.length === 0 && (
                  <div className="px-6 py-8 text-center text-slate-500">No recent activity</div>
                )}
              </div>
            </section>

            {/* Whale Activities */}
            {data.isWhale && data.whaleActivities.length > 0 && (
              <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <span className="text-lg">🐋</span>
                  <h2 className="font-semibold">Whale Activities</h2>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {data.whaleActivities.map((wa, i) => (
                    <div key={i} className="px-6 py-4 hover:bg-slate-800/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-slate-200 capitalize">
                            {wa.type.replace('_', ' ')}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">{wa.asset}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-amber-400 font-mono font-medium">
                            ${parseFloat(wa.amountUsd).toLocaleString()}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(wa.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="font-semibold">Open Positions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                    <th className="px-6 py-3 text-left">Asset</th>
                    <th className="px-6 py-3 text-left">Side</th>
                    <th className="px-6 py-3 text-right">Size</th>
                    <th className="px-6 py-3 text-right">Entry Price</th>
                    <th className="px-6 py-3 text-right">Position Value</th>
                    <th className="px-6 py-3 text-right">Unrealized PnL</th>
                    <th className="px-6 py-3 text-right">Leverage</th>
                    <th className="px-6 py-3 text-right">Liq. Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.positions?.positions?.map((pos, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-6 py-3 font-medium">{pos.coin}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          parseFloat(pos.szi) > 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {parseFloat(pos.szi) > 0 ? 'Long' : 'Short'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-mono">{Math.abs(parseFloat(pos.szi)).toFixed(4)}</td>
                      <td className="px-6 py-3 text-right font-mono">${parseFloat(pos.entryPx).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right font-mono">${parseFloat(pos.positionValue).toFixed(2)}</td>
                      <td className={`px-6 py-3 text-right font-mono ${
                        parseFloat(pos.unrealizedPnl) >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        ${parseFloat(pos.unrealizedPnl).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right font-mono">{pos.leverage}x</td>
                      <td className="px-6 py-3 text-right font-mono text-red-400">
                        {pos.liquidationPx ? `$${parseFloat(pos.liquidationPx).toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                  {(!data.positions?.positions || data.positions.positions.length === 0) && (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                        No open positions
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="font-semibold">Transaction History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                    <th className="px-6 py-3 text-left">Hash</th>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-right">Value</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.recentTransactions.map((tx) => (
                    <tr key={tx.hash} className="hover:bg-slate-800/30">
                      <td className="px-6 py-3">
                        <Link href={`/tx/${tx.hash}`} className="text-cyan-400 hover:text-cyan-300 font-mono text-xs">
                          {truncate(tx.hash)}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-slate-300 capitalize">{tx.type || 'transfer'}</td>
                      <td className="px-6 py-3 text-right font-mono">${parseFloat(tx.value).toFixed(2)}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          tx.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-400 text-xs">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    cyan: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20 text-cyan-400',
    blue: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400',
    emerald: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400',
    purple: 'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg border p-4`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-bold font-mono">{value}</p>
    </div>
  );
        }
