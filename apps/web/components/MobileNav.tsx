'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const btn = document.getElementById('mobile-menu-btn');
    if (btn) {
      btn.addEventListener('click', () => setIsOpen(true));
    }
    return () => {
      if (btn) {
        btn.removeEventListener('click', () => setIsOpen(true));
      }
    };
  }, []);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-72 bg-slate-900 border-l border-slate-800 z-50 md:hidden flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <span className="font-bold text-lg">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <MobileNavLink href="/" icon="⛓️" label="Explorer" onClick={() => setIsOpen(false)} />
          <MobileNavLink href="/whales" icon="🐋" label="Whale Tracking" onClick={() => setIsOpen(false)} />
          <MobileNavLink href="/vaults" icon="🏦" label="Vault Analytics" onClick={() => setIsOpen(false)} />
          <MobileNavLink href="/bundles" icon="📦" label="My Bundles" onClick={() => setIsOpen(false)} />
          
          <div className="my-4 border-t border-slate-800" />
          
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Tools</p>
            <MobileNavLink href="#" icon="🔔" label="Price Alerts" onClick={() => setIsOpen(false)} />
            <MobileNavLink href="#" icon="💾" label="Export Data" onClick={() => setIsOpen(false)} />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Network</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Hyperliquid Mainnet</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileNavLink({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
        }
