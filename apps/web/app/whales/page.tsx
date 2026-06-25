'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Whale {
  address: string;
  alias: string | null;
  firstSeen: string;
  lastSeen: string;
  totalTxCount: number;
  accountValue: number;
  positionCount: number;
}

interface WhaleActivity {
  id: number;
  address: string;
  alias: string | null;
  type: string;
  asset: string;
  amountUsd: string;
  timestamp: string;
}

export default function WhalesPage() {
  const [whales, setWhales] = useState<Whale[]>([]);
  const [activities, setActivities] = useState<WhaleActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAddress, setNewAddress] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchWhales();
    fetchActivities();
  }, []);

  async function fetchWhales() {
    try {
      const res = await fetch(`${API_URL}/api/whales`);
      const data = await res.json();
      setWhales(data);
    } catch (err) {
      console.error('Failed to fetch whales:', err);
    }
  }

  async function fetchActivities() {
    try {
      const res = await fetch(`${API_URL}/api/whales/activities`);
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  }

  async function trackNewAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!newAddress) return;

    try {
      const res = await fetch(`${API_URL}/api/whales/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: newAddress }),
      });
      
      if (res.ok) {
        setNewAddress('');
        fetchWhales();
      }
    } catch (err) {
      console.error('Failed to track address:', err);
    }
  }

  const formatUsd = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">🐋</span> Whale Tracking
            </h1>
            <p className="text-slate-400 mt-1">Monitor large traders and smart money movements</p>
          </div>
        </div>

        {/* Track New Address */}
        <form onSubmit={trackNewAddress} className="mb-8 flex gap-3">
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Enter address to track (0x...)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono text-sm"
          />
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Track Address
          </button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Whale List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Tracked Whales ({whales.length})</h2>
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800/50">
                {whales.map((whale) => (
                  <Link
                    key={whale.address}
                    href={`/address/${whale.address}`}
                    className="block px-6 py-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm text-cyan-400">
                        {whale.alias || `${whale.address.slice(0, 8)}...${whale.address.slice(-4)}`}
                      </span>
                      <span className="text-xs text-slate-500">
                        {whale.positionCount} pos
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {formatUsd(whale.accountValue)}
                      </span>
                      <span className="text-slate-500">
                        {new Date(whale.lastSeen).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
                {whales.length === 0 && (
                  <div className="px-6 py-8 text-center text-slate-500">
                    No whales tracked yet. Add an address above.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Live Activity Feed
            </h2>
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800/50">
                {activities.map((act) => (
                  <div key={act.id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          act.type.includes('buy') || act.type.includes('long')
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {act.type.includes('buy') || act.type.includes('long') ? '↑' : '↓'}
                        </div>
                        <div>
                          <Link href={`/address/${act.address}`} className="text-sm text-cyan-400 hover:text-cyan-300 font-mono">
                            {act.alias || `${act.address.slice(0, 8)}...${act.address.slice(-4)}`}
                          </Link>
                          <p className="text-xs text-slate-500 capitalize">
                            {act.type.replace('_', ' ')} • {act.asset}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-400 font-mono font-medium">
                          {formatUsd(parseFloat(act.amountUsd))}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(act.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="px-6 py-8 text-center text-slate-500">
                    No whale activities yet. Waiting for large trades...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
                }
