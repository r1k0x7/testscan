'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      <div className={`
        relative flex items-center
        bg-slate-900 border rounded-xl
        transition-all duration-200
        ${isFocused 
          ? 'border-cyan-500/50 ring-2 ring-cyan-500/20' 
          : 'border-slate-700 hover:border-slate-600'
        }
      `}>
        <svg 
          className="absolute left-3 md:left-4 w-5 h-5 text-slate-500 shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        <input
          id="global-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search tx, address, block..."
          className="w-full bg-transparent py-3 md:py-4 pl-10 md:pl-12 pr-12 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Desktop shortcut hint */}
        <div className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 rounded border border-slate-700 text-slate-400">⌘K</kbd>
        </div>
      </div>
      
      {/* Mobile search hint */}
      <p className="md:hidden text-xs text-slate-500 mt-2 px-1">
        Try: 0x... (address), 0x... (tx hash), or 12345 (block)
      </p>
    </form>
  );
      }
