'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface TxDetail {
  hash: string;
  blockNumber: string;
  blockHash: string;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string | null;
  gasUsed: string | null;
  status: string;
  type: string | null;
  input: string | null;
  timestamp: string;
}

export default function TxPage() {
  const params = useParams();
  const hash = params.hash as string;
  const [tx, setTx] = useState<TxDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchTx();
  }, [hash]);

  async function fetchTx() {
    try {
      const res = await fetch(`${API_URL}/api/transactions/${hash}`);
      const data = await res.json();
      setTx(data);
    } catch (err) {
      console.error('Failed to fetch tx:', err);
    } finally {
      setLoading(false);
    }
  }

  const truncate = (str: string) => `${str.slice(0, 10)}...${str.slice(-8)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Transaction Not Found</h2>
          <p className="text-slate-400 font-mono">{hash}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Transaction Details</h1>

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {/* Status Banner */}
          <div className={`px-6 py-3 border-b border-slate-800 flex items-center gap-2 ${
            tx.status === 'success' ? 'bg-emerald-500/5' : 'bg-red-500/5'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              tx.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
            }`} />
            <span className={`text-sm font-medium ${
              tx.status === 'success' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {tx.status === 'success' ? 'Success' : 'Failed'}
            </span>
          </div>

          {/* Details */}
          <div className="divide-y divide-slate-800/50">
            <DetailRow label="Transaction Hash" value={tx.hash} isMono copyable />
            <DetailRow label="Block" value={
              <Link href={`/block/${tx.blockNumber}`} className="text-cyan-400 hover:text-cyan-300">
                #{tx.blockNumber}
              </Link>
            } />
            <DetailRow label="Block Hash" value={truncate(tx.blockHash)} isMono />
            <DetailRow label="From" value={
              <Link href={`/address/${tx.from}`} className="text-cyan-400 hover:text-cyan-300 font-mono">
                {tx.from}
              </Link>
            } />
            <DetailRow label="To" value={
              tx.to ? (
                <Link href={`/address/${tx.to}`} className="text-cyan-400 hover:text-cyan-300 font-mono">
                  {tx.to}
                </Link>
              ) : (
                <span className="text-slate-500">Contract Creation</span>
              )
            } />
            <DetailRow label="Value" value={`$${parseFloat(tx.value).toFixed(2)}`} />
            <DetailRow label="Transaction Type" value={tx.type || 'Transfer'} />
            <DetailRow label="Gas Price" value={tx.gasPrice ? `${tx.gasPrice} Gwei` : '-'} />
            <DetailRow label="Gas Used" value={tx.gasUsed || '-'} />
            <DetailRow label="Timestamp" value={new Date(tx.timestamp).toLocaleString()} />
          </div>

          {/* Input Data */}
          {tx.input && (
            <div className="px-6 py-4 border-t border-slate-800">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Input Data</h3>
              <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-400 break-all">
                {tx.input}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function DetailRow({ label, value, isMono = false, copyable = false }: {
  label: string;
  value: React.ReactNode;
  isMono?: boolean;
  copyable?: boolean;
}) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
      <div className="sm:w-40 text-sm text-slate-400">{label}</div>
      <div className={`flex-1 text-sm ${isMono ? 'font-mono' : ''} text-slate-200`}>
        {value}
      </div>
      {copyable && typeof value === 'string' && (
        <button
          onClick={() => copyToClipboard(value)}
          className="text-slate-500 hover:text-cyan-400 transition-colors"
          title="Copy"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      )}
    </div>
  );
    }
