'use client';

import React from 'react';
import { MarketQuote } from '@/lib/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketTickerProps {
  quotes: MarketQuote[];
}

export default function MarketTicker({ quotes }: MarketTickerProps) {
  const displayQuotes = [...quotes, ...quotes];

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-2 overflow-hidden select-none transition-colors duration-200">
      <div className="flex items-center">
        <div className="flex-shrink-0 z-10 bg-slate-100 dark:bg-slate-900 px-4 py-0.5 border-r border-slate-300 dark:border-slate-700 text-xs font-bold tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
          <span>实时全球行情</span>
        </div>

        <div className="overflow-hidden relative w-full">
          <div className="animate-ticker flex items-center gap-8 pl-6">
            {displayQuotes.map((q, idx) => (
              <div
                key={`${q.symbol}-${idx}`}
                className="inline-flex items-center gap-2 text-xs md:text-sm font-medium hover:bg-slate-200/70 dark:hover:bg-slate-800 px-2 py-0.5 rounded transition-colors"
              >
                <span className="text-slate-600 dark:text-slate-400 font-semibold">{q.name}</span>
                <span className="text-slate-900 dark:text-slate-100 font-bold font-mono">{q.price}</span>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-bold font-mono ${
                    q.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {q.isUp ? (
                    <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  {q.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
