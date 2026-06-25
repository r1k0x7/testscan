'use client';

import { useState } from 'react';

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  mobile?: boolean; // show on mobile?
  render: (row: T) => React.ReactNode;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  cardTitle?: (row: T) => React.ReactNode;
  cardSubtitle?: (row: T) => React.ReactNode;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data found',
  onRowClick,
  cardTitle,
  cardSubtitle,
}: ResponsiveTableProps<T>) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (id: string) => {
    const next = new Set(expandedCards);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedCards(next);
  };

  const mobileColumns = columns.filter((c) => c.mobile !== false);

  return (
    <div className="w-full">
      {/* Desktop: Traditional Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-left font-medium ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-slate-800/30 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-3 ${col.className || ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-3">
        {data.map((row) => {
          const id = keyExtractor(row);
          const isExpanded = expandedCards.has(id);

          return (
            <div
              key={id}
              onClick={() => onRowClick?.(row)}
              className={`bg-slate-900 rounded-xl border border-slate-800 overflow-hidden ${
                onRowClick ? 'active:scale-[0.98] transition-transform' : ''
              }`}
            >
              {/* Card Header */}
              <div
                className="p-4 flex items-center justify-between"
                onClick={(e) => {
                  if (!onRowClick) {
                    e.stopPropagation();
                    toggleCard(id);
                  }
                }}
              >
                <div className="min-w-0">
                  {cardTitle ? (
                    <div className="font-medium text-slate-100 truncate">{cardTitle(row)}</div>
                  ) : (
                    <div className="font-medium text-slate-100 truncate">
                      {mobileColumns[0]?.render(row)}
                    </div>
                  )}
                  {cardSubtitle && (
                    <div className="text-xs text-slate-500 mt-0.5">{cardSubtitle(row)}</div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCard(id);
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition-colors shrink-0 ml-2"
                >
                  <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Quick Stats (always visible) */}
              <div className="px-4 pb-3 flex gap-4 overflow-x-auto scrollbar-hide">
                {mobileColumns.slice(1, 4).map((col) => (
                  <div key={col.key} className="shrink-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{col.header}</p>
                    <div className="text-sm font-mono text-slate-300 mt-0.5">{col.render(row)}</div>
                  </div>
                ))}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-800/50 px-4 py-3 space-y-2">
                  {mobileColumns.slice(4).map((col) => (
                    <div key={col.key} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{col.header}</span>
                      <span className="text-sm text-slate-300">{col.render(row)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="text-center py-8 text-slate-500">{emptyMessage}</div>
        )}
      </div>
    </div>
  );
                                                                }
