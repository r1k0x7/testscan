'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PnLChart } from '@/components/charts/PnLChart';

interface Vault {
  address: string;
  name: string;
  leader: string;
  tvl: string;
  apr: string | null;
  totalPnl: string | null;
  depositorCount: number;
  isOpen: boolean;
}

export default function VaultsPage() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ topApr: Vault[]; topPnl: Vault[] } | null>(null);
  const [sortBy, setSortBy] = useState<'apr' | 'pnl' | 'tvl'>('apr');
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchVaults();
    fetchLeaderboard();
  }, [sortBy]);

  async function fetchVaults() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/vaults?sort=${sortBy}&limit=50`);
      const data = await res.json();
      setVaults(data);
    } catch (err) {
      console.error('Failed to fetch vaults:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLeaderboard() {
    try {
      const res = await fetch(`${API_URL}/api/vaults/leaderboard`);
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }

  const formatUsd = (val: string) => {
    const num = parseFloat(val);
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const truncate = (str: string) => `${str.slice(0, 6)}...${str.slice(-4)}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Vault Analytics</h1>
        <p className="text-slate-400 mb-8">Hyperliquid vault performance and leaderboard</p>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <p className="text-sm text-slate-400 mb-1">Total Vaults</p>
            <p className="text-2xl font-bold font-mono">{vaults.length}</p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <p className="text-sm text-slate-400 mb-1">Top APR</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">
              {leaderboard?.topApr[0]?.apr ? `${parseFloat(leaderboard.topApr[0].apr).toFixed(2)}%` : '-'}
            </p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <p className="text-sm text-slate-400 mb-1">Best PnL</p>
            <p className="text-2xl font-bold font-mono text-cyan-400">
              {leaderboard?.topPnl[0]?.totalPnl ? formatUsd(leaderboard.topPnl[0].totalPnl) : '-'}
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <h2 className="font-semibold flex items-center gap-2">
                  <span className="text-emerald-400">🏆</span> Top APR
                </h2>
              </div>
              <div className="divide-y divide-slate-800/50">
                {leaderboard.topApr.map((v, i) => (
                  <div key={v.address} className="px-6 py-3 flex items-center justify-between hover:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-mono w-6">#{i + 1}</span>
                      <div>
                        <Link href={`/vaults/${v.address}`} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">
                          {v.name}
                        </Link>
                        <p className="text-xs text-slate-500 font-mono">{truncate(v.leader)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-mono font-medium">{parseFloat(v.apr || '0').toFixed(2)}%</span>
                      <p className="text-xs text-slate-500">{formatUsd(v.tvl)} TVL</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <h2 className="font-semibold flex items-center gap-2">
                  <span className="text-cyan-400">📈</span> Top PnL
                </h2>
              </div>
              <div className="divide-y divide-slate-800/50">
                {leaderboard.topPnl.map((v, i) => (
                  <div key={v.address} className="px-6 py-3 flex items-center justify-between hover:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-mono w-6">#{i + 1}</span>
                      <div>
                        <Link href={`/vaults/${v.address}`} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">
                          {v.name}
                        </Link>
                        <p className="text-xs text-slate-500 font-mono">{truncate(v.leader)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-cyan-400 font-mono font-medium">{formatUsd(v.totalPnl || '0')}</span>
                      <p className="text-xs text-slate-500">{formatUsd(v.tvl)} TVL</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vault List */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold">All Vaults</h2>
            <div className="flex gap-2">
              {(['apr', 'pnl', 'tvl'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                    sortBy === s
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                  <th className="px-6 py-3 text-left">Vault</th>
                  <th className="px-6 py-3 text-left">Leader</th>
                  <th className="px-6 py-3 text-right">TVL</th>
                  <th className="px-6 py-3 text-right">APR</th>
                  <th className="px-6 py-3 text-right">Total PnL</th>
                  <th className="px-6 py-3 text-center">Depositors</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {vaults.map((v) => (
                  <tr key={v.address} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/vaults/${v.address}`} className="text-cyan-400 hover:text-cyan-300 font-medium">
                        {v.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {truncate(v.leader)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">{formatUsd(v.tvl)}</td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-400">
                      {v.apr ? `${parseFloat(v.apr).toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-cyan-400">
                      {v.totalPnl ? formatUsd(v.totalPnl) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">
                        {v.depositorCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        v.isOpen
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {v.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </td>
                  </tr>
                ))}
                {vaults.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No vaults found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
      }
