import Link from 'next/link';

interface Block {
  number: string;
  hash: string;
  timestamp: string;
  txCount: number;
  validator: string | null;
}

export function BlockTable({ blocks }: { blocks: Block[] }) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const truncateHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-6)}`;

  return (
    <div className="overflow-x-auto">
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
            <tr key={block.number} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-6 py-3">
                <Link href={`/block/${block.number}`} className="text-cyan-400 hover:text-cyan-300 font-mono">
                  {block.number}
                </Link>
              </td>
              <td className="px-6 py-3 text-slate-400">{formatTime(block.timestamp)}</td>
              <td className="px-6 py-3">
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">
                  {block.txCount}
                </span>
              </td>
              <td className="px-6 py-3 font-mono text-slate-400">
                {block.validator ? truncateHash(block.validator) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {blocks.length === 0 && (
        <div className="px-6 py-8 text-center text-slate-500">No blocks found</div>
      )}
    </div>
  );
}
