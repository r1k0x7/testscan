'use client';

import { useEffect, useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { BlockTable } from '@/components/BlockTable';
import { TxTable } from '@/components/TxTable';
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
    // Fetch initial data
    fetchBlocks();
    fetchTransactions();
    
    // WebSocket connection
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

    // Auto refresh setiap 5 detik
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
              H
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              HypurrScan Clone
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-sm ${wsConnected ? 'text-emerald-400' : 'text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {wsConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard title="Latest Block" value={stats.blocks.toLocaleString()} icon="⛓️" />
          <StatsCard title="Total Txs (24h)" value={stats.txs.toLocaleString()} icon="📊" />
          <StatsCard title="TPS" value={stats.tps.toFixed(2)} icon="⚡" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Latest Blocks */}
          <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-lg">Latest Blocks</h2>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Real-time</span>
            </div>
            <BlockTable blocks={blocks} />
          </section>

          {/* Latest Transactions */}
          <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-lg">Latest Transactions</h2>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Real-time</span>
            </div>
            <TxTable transactions={transactions} />
          </section>
        </div>
      </div>
    </main>
  );
    }
