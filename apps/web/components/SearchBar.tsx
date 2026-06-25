'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.results.length === 1) {
        const result = data.results[0];
        if (result.type === 'transaction') router.push(`/tx/${result.txHash}`);
        else if (result.type === 'address') router.push(`/address/${result.address}`);
        else if (result.type === 'block') router.push(`/block/${result.blockNumber}`);
      } else if (data.results.length > 1) {
        // TODO: Show search results page
        console.log('Multiple results:', data.results);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Tx Hash, Address, or Block Number..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 pl-12 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
        <kbd className="px-2 py-1 text-xs bg-slate-800 rounded border border-slate-700 text-slate-400">⌘K</kbd>
      </div>
    </form>
  );
            }
