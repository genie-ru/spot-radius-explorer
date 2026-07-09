'use client';

import { useEffect, useState } from 'react';
import { useCenterAddress } from '../hooks/useCenterAddress';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { fetchSpots } from '../lib/api';
import {
  DESKTOP_MIN_WIDTH_PX,
  INITIAL_CENTER,
  INITIAL_RADIUS_KM,
  RADIUS_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
} from '../lib/config';
import { nextRadius } from '../lib/radius';
import type { Spot } from '../lib/types';
import { CenterAddress } from './CenterAddress';
import { MapView } from './MapView';
import { RadiusSlider } from './RadiusSlider';
import { SpotList } from './SpotList';

// 単一状態源: center / radiusKm からマーカー（地図）と一覧（リスト）を派生させ、表示ズレを防ぐ。
export function SpotExplorer() {
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [radiusKm, setRadiusKm] = useState(INITIAL_RADIUS_KM);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false); // 既定は全画面地図。タブでパネルを重ねる。

  const debouncedCenter = useDebouncedValue(center, SEARCH_DEBOUNCE_MS);
  const debouncedRadius = useDebouncedValue(radiusKm, RADIUS_DEBOUNCE_MS);

  // 中心住所（debounce＋空間ゲート＋メモリキャッシュ＋Abort で外部呼び出しを最小化）。
  const { address, loading: addressLoading } = useCenterAddress(center);

  // 初期表示: デスクトップ(md 以上)はパネルを開く／スマホは地図優先で閉じたまま。
  useEffect(() => {
    if (window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH_PX}px)`).matches) {
      setPanelOpen(true);
    }
  }, []);

  // 半径検索（自前 PostGIS・自動）。前回リクエストは中断する。
  useEffect(() => {
    const controller = new AbortController();
    setSearching(true);
    fetchSpots(
      { lat: debouncedCenter.lat, lng: debouncedCenter.lng, radiusKm: debouncedRadius },
      controller.signal,
    )
      .then((res) => setSpots(res.items))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => setSearching(false));
    return () => controller.abort();
  }, [debouncedCenter, debouncedRadius]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 地図は常に全画面（背面）。 */}
      <div className="absolute inset-0">
        <MapView
          center={center}
          radiusKm={radiusKm}
          spots={spots}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onCenterChange={setCenter}
          onSelect={setSelectedId}
          onRadiusChange={setRadiusKm}
        />
      </div>

      {/* サイドパネル: PC=左ドロワー（横スライド）／スマホ=下ボトムシート（縦スライド）。 */}
      <aside
        className={`absolute inset-x-0 bottom-0 top-auto z-20 flex h-[70vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-transform duration-300 ease-in-out md:inset-x-auto md:bottom-3 md:left-3 md:top-3 md:h-auto md:w-96 md:max-w-[calc(100%-1.5rem)] md:rounded-xl ${
          panelOpen
            ? 'translate-y-0'
            : 'translate-y-[calc(100%-3.5rem)] md:translate-y-0 md:-translate-x-[calc(100%+1rem)]'
        }`}
      >
        {/* スマホ: 上部グラブハンドル（件数を表示。タップで開閉。閉時は画面下にのぞく）。 */}
        <button
          onClick={() => setPanelOpen((v) => !v)}
          aria-label={panelOpen ? 'リストを閉じる' : 'リストを開く'}
          className="flex h-14 w-full shrink-0 flex-col items-center justify-center gap-1 md:hidden"
        >
          <span className="h-1.5 w-10 rounded-full bg-slate-300" />
          <span className="text-xs font-medium text-slate-600">
            {searching ? '検索中…' : `${spots.length} 件のスポット`}
          </span>
        </button>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                </svg>
              </span>
              <div>
                <h1 className="text-base font-bold leading-tight text-slate-900">
                  スポット周辺探索
                </h1>
                <p className="text-[11px] text-slate-400">地図を動かして周辺を検索</p>
              </div>
            </div>
            <CenterAddress address={address} loading={addressLoading} />
            <RadiusSlider radiusKm={radiusKm} onChange={setRadiusKm} />
          </div>
          <SpotList
            spots={spots}
            loading={searching}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelect={setSelectedId}
            onWiden={() => setRadiusKm((r) => nextRadius(r))}
          />
        </div>
      </aside>

      {/* PC: 開閉タブ（縦センター）。閉時は画面左端、開時はパネル右端へ移動。 */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        aria-label={panelOpen ? 'パネルを閉じる' : 'パネルを開く'}
        className={`absolute top-1/2 z-30 hidden h-16 w-8 -translate-y-1/2 items-center justify-center rounded-r-lg bg-white text-slate-600 shadow-md ring-1 ring-black/5 transition-[left] duration-300 ease-in-out hover:bg-slate-50 md:flex ${
          panelOpen ? 'left-[calc(0.75rem+24rem)]' : 'left-0'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 transition-transform ${panelOpen ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    </div>
  );
}
