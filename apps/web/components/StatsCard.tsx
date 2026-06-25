export function StatsCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-slate-100 font-mono">{value}</div>
    </div>
  );
}
