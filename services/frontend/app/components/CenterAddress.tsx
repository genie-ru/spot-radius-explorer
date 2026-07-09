interface Props {
  address: string | null;
  loading: boolean;
}

export function CenterAddress({ address, loading }: Props) {
  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-slate-50 p-3">
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
      </svg>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-400">地図中心の住所</div>
        {loading ? (
          <div className="mt-1.5 h-4 w-44 animate-pulse rounded bg-slate-200" />
        ) : (
          <div className="mt-0.5 line-clamp-2 text-sm text-slate-700">
            {address ?? '住所を取得できませんでした'}
          </div>
        )}
      </div>
    </div>
  );
}
