import Link from 'next/link';

interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  status: string;
  type: string | null;
  timestamp: string;
}

export function TxTable({ transactions }: { transactions: Transaction[] }) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatValue = (val: string) => {
    const num = parseFloat(val) / 1e18;
    return num < 0.001 ? '<0.001' : num.toFixed(4);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
            <th className="px-6 py-3 text-left">Tx Hash</th>
            <th className="px-6 py-3 text-left">From</th>
            <th className="px-6 py-3 text-left">To</th>
            <th className="px-6 py-3 text-right">Value</th>
            <th className="px-6 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {transactions.map((tx) => (
            <tr key={tx.hash} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-6 py-3">
                <Link href={`/tx/${tx.hash}`} className="text-cyan-400 hover:text-cyan-300 font-mono text-xs">
                  {truncate(tx.hash)}
                </Link>
              </td>
              <td className="px-6 py-3 font-mono text-xs text-slate-400">
                <Link href={`/address/${tx.from}`} className="hover:text-cyan-400">
                  {truncate(tx.from)}
                </Link>
              </td>
              <td className="px-6 py-3 font-mono text-xs text-slate-400">
                {tx.to ? (
                  <Link href={`/address/${tx.to}`} className="hover:text-cyan-400">
                    {truncate(tx.to)}
                  </Link>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-6 py-3 text-right font-mono text-slate-300">
                {formatValue(tx.value)} ETH
              </td>
              <td className="px-6 py-3">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  tx.status === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {tx.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {transactions.length === 0 && (
        <div className="px-6 py-8 text-center text-slate-500">No transactions found</div>
      )}
    </div>
  );
}
