'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  addresses: string[];
  color: string | null;
  isPublic: boolean;
  createdAt: string;
  totalValue: number;
  openPositions: number;
  addressCount: number;
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newBundle, setNewBundle] = useState({ name: '', description: '', addresses: '', color: '#06b6d4' });
  const [userId] = useState('demo-user'); // TODO: Replace with real auth

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchBundles();
  }, []);

  async function fetchBundles() {
    try {
      const res = await fetch(`${API_URL}/api/bundles?userId=${userId}`);
      const data = await res.json();
      setBundles(data);
    } catch (err) {
      console.error('Failed to fetch bundles:', err);
    }
  }

  async function createBundle(e: React.FormEvent) {
    e.preventDefault();
    const addresses = newBundle.addresses.split(',').map(a => a.trim()).filter(a => a.startsWith('0x'));

    try {
      const res = await fetch(`${API_URL}/api/bundles?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBundle.name,
          description: newBundle.description,
          addresses,
          color: newBundle.color,
        }),
      });

      if (res.ok) {
        setShowCreate(false);
        setNewBundle({ name: '', description: '', addresses: '', color: '#06b6d4' });
        fetchBundles();
      }
    } catch (err) {
      console.error('Failed to create bundle:', err);
    }
  }

  async function deleteBundle(id: string) {
    if (!confirm('Delete this bundle?')) return;
    try {
      await fetch(`${API_URL}/api/bundles/${id}?userId=${userId}`, { method: 'DELETE' });
      fetchBundles();
    } catch (err) {
      console.error('Failed to delete bundle:', err);
    }
  }

  const formatUsd = (val: number) => {
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Address Bundles</h1>
            <p className="text-slate-400 mt-1">Group and track multiple addresses</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Bundle
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
            <h2 className="font-semibold mb-4">Create New Bundle</h2>
            <form onSubmit={createBundle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newBundle.name}
                    onChange={(e) => setNewBundle({ ...newBundle, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="My Whale Watches"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newBundle.color}
                      onChange={(e) => setNewBundle({ ...newBundle, color: e.target.value })}
                      className="w-10 h-10 rounded bg-transparent border border-slate-700 cursor-pointer"
                    />
                    <span className="text-sm text-slate-500 font-mono">{newBundle.color}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={newBundle.description}
                  onChange={(e) => setNewBundle({ ...newBundle, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Addresses <span className="text-slate-600">(comma separated)</span>
                </label>
                <textarea
                  required
                  value={newBundle.addresses}
                  onChange={(e) => setNewBundle({ ...newBundle, addresses: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono text-xs h-24"
                  placeholder="0x..., 0x..., 0x..."
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Create Bundle
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-200 px-4 py-2">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: bundle.color || '#06b6d4' }}
                  />
                  <h3 className="font-semibold">{bundle.name}</h3>
                </div>
                <button
                  onClick={() => deleteBundle(bundle.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-slate-400 mb-4">{bundle.description || 'No description'}</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-cyan-400">{bundle.addressCount}</p>
                    <p className="text-xs text-slate-500">Addresses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-emerald-400">{bundle.openPositions}</p>
                    <p className="text-xs text-slate-500">Positions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-amber-400">{formatUsd(bundle.totalValue)}</p>
                    <p className="text-xs text-slate-500">Total Value</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bundle.addresses.slice(0, 3).map((addr) => (
                    <Link
                      key={addr}
                      href={`/address/${addr}`}
                      className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono hover:bg-slate-700 transition-colors"
                    >
                      {addr.slice(0, 6)}...{addr.slice(-4)}
                    </Link>
                  ))}
                  {bundle.addresses.length > 3 && (
                    <span className="text-xs text-slate-500 px-2 py-1">
                      +{bundle.addresses.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50">
                <Link
                  href={`/bundles/${bundle.id}`}
                  className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center justify-center gap-1"
                >
                  View Details
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
          {bundles.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No bundles yet. Create one to start tracking multiple addresses.
            </div>
          )}
        </div>
      </div>
    </main>
  );
              }
