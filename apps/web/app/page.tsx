'use client';

import { useEffect, useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { StatsCard } from '@/components/StatsCard';

interface Block {
  number: string;
  hash: string;
  timestamp: string;
  txCount: number;
  validator: string | null;
}

interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  status: string;
  type: string | null;
  timestamp: string;
}

export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ blocks: 0, txs: 0, tps: 0 });
  const [wsConnected, setWsConnected] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

  useEffect(() => {
    fetchBlocks();
    fetchTransactions();
    
    const ws = new WebSocket(`${WS_URL}/ws/feed`);
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.channel === 'blocks:new') {
        setBlocks(prev => [msg.data, ...prev].slice(0, 10));
      }
      if (msg.channel === 'txs:new') {
        setTransactions(prev => [msg.data, ...prev].slice(0, 20));
      }
    };

    const interval = setInterval(() => {
      fetchBlocks();
      fetchTransactions();
    }, 5000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  async function fetchBlocks() {
    try {
      const res = await fetch(`${API_URL}/api/blocks/latest?limit=10`);
      const data = await res.json();
      setBlocks(data);
      setStats(prev => ({ ...prev, blocks: data.length > 0 ? parseInt(data[0].number) : 0 }));
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
    }
  }

  async function fetchTransactions() {
    try {
      const res = await fetch(`${API_URL}/api/transactions/latest?limit=20`);
      const data = await res.json();
      setTransactions(data);
      setStats(prev => ({ ...prev, txs: data.length }));
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  }

  const truncate = (str: string, start = 6, end = 4) => `${str.slice(0, start)}...${str.slice(-end)}`;
  const formatTime = (timestamp: string) => {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Search - full width on mobile */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* Stats - 2 cols on mobile, 3 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatsCard title="Latest Block" value={stats.blocks.toLocaleString()} icon="⛓️" />
          <StatsCard title="Total Txs" value={stats.txs.toLocaleString()} icon="📊" />
          <StatsCard title="TPS" value={stats.tps.toFixed(2)} icon="⚡" className="col-span-2 md:col-span-1" />
        </div>

        {/* Connection Status - mobile only */}
        <div className="md:hidden flex items-center gap-2 mb-4 text-xs">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span className={wsConnected ? 'text-emerald-400' : 'text-red-400'}>
            {wsConnected ? 'Live Updates' : 'Offline'}
          </span>
        </div>

        {/* Content - stacked on mobile, side by side on desktop */}
        <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-8">
          {/* Latest Blocks */}
          <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-base md:text-lg">Latest Blocks</h2>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Real-time</span>
            </div>
            
            {/* Mobile: Card view */}
            <div className="md:hidden divide-y divide-slate-800/50">
              {blocks.map((block) => (
                <a
                  key={block.number}
                  href={`/block/${block.number}`}
                  className="block p-4 active:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-400 font-mono font-medium">#{block.number}</span>
                    <span className="text-xs text-slate-500">{formatTime(block.timestamp)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{block.txCount} txs</span>
                    <span className="font-mono text-xs text-slate-500">
                      {block.validator ? truncate(block.validator, 4, 4) : '-'}
                    </span>
                  </div>
                </a>
              ))}
              {blocks.length === 0 && (
                <div className="p-4 text-center text-slate-500 text-sm">No blocks found</div>
              )}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                    <th className="px-6 py-3 text-left">Block</th>
                    <th className="px-6 py-3 text-left">Age</th>
                    <th className="px-6 py-3 text-left">Txs</th>
                    <th className="px-6 py-3 text-left">Validator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {blocks.map((block) => (
                    <tr key={block.number} className="hover:bg-slate-800/30">
                      <td className="px-6 py-3">
                        <a href={`/block/${block.number}`} className="text-cyan-400 hover:text-cyan-300 font-mono">
                          {block.number}
                        </a>
                      </td>
                      <td className="px-6 py-3 text-slate-400">{formatTime(block.timestamp)}</td>
                      <td className="px-6 py-3">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">{block.txCount}</span>
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-400">
                        {block.validator ? truncate(block.validator) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Latest Transactions */}
          <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-base md:text-lg">Latest Transactions</h2>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Real-time</span>
            </div>

            {/* Mobile: Card view */}
            <div className="md:hidden divide-y divide-slate-800/50">
              {transactions.map((tx) => (
                <a
                  key={tx.hash}
                  href={`/tx/${tx.hash}`}
                  className="block p-4 active:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-400 font-mono text-xs">{truncate(tx.hash, 8, 6)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      tx.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="font-mono text-xs">{truncate(tx.from, 4, 4)}</span>
                      <span>→</span>
                      <span className="font-mono text-xs">{tx.to ? truncate(tx.to, 4, 4) : '-'}</span>
                    </div>
                    <span className="font-mono text-slate-300">${parseFloat(tx.value).toFixed(2)}</span>
                  </div>
                </a>
              ))}
              {transactions.length === 0 && (
                <div className="p-4 text-center text-slate-500 text-sm">No transactions found</div>
              )}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                    <th className="px-6 py-3 text-left">Hash</th>
                    <th className="px-6 py-3 text-left">From</th>
                    <th className="px-6 py-3 text-left">To</th>
                    <th className="px-6 py-3 text-right">Value</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {transactions.map((tx) => (
                    <tr key={tx.hash} className="hover:bg-slate-800/30">
                      <td className="px-6 py-3">
                        <a href={`/tx/${tx.hash}`} className="text-cyan-400 hover:text-cyan-300 font-mono text-xs">
                          {truncate(tx.hash)}
                        </a>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-400">{truncate(tx.from)}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-400">
                        {tx.to ? truncate(tx.to) : '-'}
                      </td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
