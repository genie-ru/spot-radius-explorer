import { AnimatePresence, motion } from 'framer-motion';
import { categoryColor, categoryTint } from '../lib/category';
import type { Spot } from '../lib/types';

interface Props {
  spots: Spot[];
  loading: boolean;
  selectedId: number | null;
  hoveredId: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
  onWiden: () => void;
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="mt-1 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-slate-200" />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-3 w-44 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function SpotList({
  spots,
  loading,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  onWiden,
}: Props) {
  const showSkeleton = loading && spots.length === 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <span className="text-sm font-semibold text-slate-700">
          {loading ? '検索中…' : `${spots.length} 件のスポット`}
        </span>
        {!loading && spots.length > 0 && <span className="text-xs text-slate-400">近い順</span>}
      </div>

      {showSkeleton ? (
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : !loading && spots.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <svg
            viewBox="0 0 24 24"
            className="h-10 w-10 text-slate-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-slate-500">この範囲にスポットがありません。</p>
          <button
            onClick={onWiden}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            半径を広げる
          </button>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          <AnimatePresence initial={false}>
            {spots.map((spot) => {
              const active = spot.id === selectedId || spot.id === hoveredId;
              return (
                <motion.li
                  key={spot.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    layout: { type: 'spring', stiffness: 500, damping: 40 },
                    opacity: { duration: 0.2 },
                  }}
                >
                  <button
                    onMouseEnter={() => onHover(spot.id)}
                    onMouseLeave={() => onHover(null)}
                    onClick={() => onSelect(spot.id)}
                    className={`flex w-full gap-3 border-b border-l-2 border-slate-100 px-4 py-3 text-left transition-colors ${
                      active
                        ? 'border-l-blue-500 bg-blue-50/70'
                        : 'border-l-transparent hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: categoryColor(spot.category) }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate font-medium text-slate-900">{spot.name}</span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600">
                          {formatDistance(spot.distanceM)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 font-medium"
                          style={{
                            color: categoryColor(spot.category),
                            backgroundColor: categoryTint(spot.category),
                          }}
                        >
                          {spot.category}
                        </span>
                        <span className="truncate">{spot.address}</span>
                      </div>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
