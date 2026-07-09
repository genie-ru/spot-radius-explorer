'use client';

import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';
import { DEFAULT_ZOOM, MAX_RADIUS_KM, METERS_PER_KM, MIN_RADIUS_KM } from '../lib/config';
import type { Spot } from '../lib/types';

// ブラウザ公開キー（HTTPリファラ制限で保護する前提）。docker/.env から compose 経由で注入。
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
// AdvancedMarker には Map ID が必要。Cloud で作った ID か、デモ用 'DEMO_MAP_ID'。
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';

interface Props {
  center: { lat: number; lng: number };
  radiusKm: number;
  spots: Spot[];
  selectedId: number | null;
  hoveredId: number | null;
  onCenterChange: (center: { lat: number; lng: number }) => void;
  onSelect: (id: number) => void;
  onRadiusChange: (km: number) => void;
}

// 半径(km)を有効範囲にクランプ（backend の 0<radius<=MAX と整合）。0.1km 刻みに丸める。
function clampRadiusKm(km: number): number {
  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(km * 10) / 10));
}

// 半径円は google.maps.Circle を imperative に管理。editable=端のハンドルをドラッグして半径変更可。
function RadiusCircle({
  center,
  radiusKm,
  onRadiusChange,
}: {
  center: { lat: number; lng: number };
  radiusKm: number;
  onRadiusChange: (km: number) => void;
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const circleRef = useRef<google.maps.Circle | null>(null);
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const onRadiusChangeRef = useRef(onRadiusChange);
  onRadiusChangeRef.current = onRadiusChange;

  useEffect(() => {
    if (!map || !mapsLib) return;
    if (!circleRef.current) {
      circleRef.current = new mapsLib.Circle({
        map,
        center, // 生成時に中心・半径を設定（未設定だと描画されない）
        radius: radiusKm * METERS_PER_KM,
        editable: true, // 端の□ハンドルをドラッグして半径を伸縮できる
        draggable: false, // 中心は地図中心に固定（円ごとは動かさない）
        clickable: false,
        strokeColor: '#2563eb',
        strokeWeight: 2,
        fillColor: '#2563eb',
        fillOpacity: 0.08,
      });
      // ドラッグで半径が変わったらスライダー/検索へ反映。
      listenerRef.current = circleRef.current.addListener('radius_changed', () => {
        const meters = circleRef.current?.getRadius() ?? 0;
        onRadiusChangeRef.current(clampRadiusKm(meters / METERS_PER_KM));
      });
    }
    circleRef.current.setCenter(center);
    // ドラッグ由来の変更（円が既にその半径）のときは setRadius しない＝ドラッグと競合させない。
    const desired = radiusKm * METERS_PER_KM;
    if (Math.abs((circleRef.current.getRadius() ?? desired) - desired) > 1) {
      circleRef.current.setRadius(desired);
    }
  }, [map, mapsLib, center.lat, center.lng, radiusKm]);

  // アンマウント時にリスナ解除・円を剥がし・ref クリア（StrictMode 再マウントで作り直せるように）。
  useEffect(
    () => () => {
      listenerRef.current?.remove();
      listenerRef.current = null;
      circleRef.current?.setMap(null);
      circleRef.current = null;
    },
    [],
  );
  return null;
}

// 選択されたスポットへ地図をパン（クリックした場所へ移動）。
function PanToSelected({ spots, selectedId }: { spots: Spot[]; selectedId: number | null }) {
  const map = useMap();
  const spotsRef = useRef(spots);
  spotsRef.current = spots;

  useEffect(() => {
    if (!map || selectedId == null) return;
    const spot = spotsRef.current.find((s) => s.id === selectedId);
    if (spot) map.panTo({ lat: spot.lat, lng: spot.lng });
  }, [map, selectedId]);

  return null;
}

export function MapView({
  center,
  radiusKm,
  spots,
  selectedId,
  hoveredId,
  onCenterChange,
  onSelect,
  onRadiusChange,
}: Props) {
  if (!API_KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 p-6 text-center text-sm text-slate-500">
        地図の表示には NEXT_PUBLIC_GOOGLE_MAPS_API_KEY が必要です（docker/.env に設定）。
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="relative h-full w-full">
        <Map
          defaultCenter={center}
          defaultZoom={DEFAULT_ZOOM}
          mapId={MAP_ID}
          gestureHandling="greedy"
          className="h-full w-full"
          // 移動が止まったら中心を親へ通知（→ debounce → 再検索）。
          onIdle={(e) => {
            const c = e.map.getCenter();
            if (c) onCenterChange({ lat: c.lat(), lng: c.lng() });
          }}
        >
          {spots.map((spot) => {
            const active = spot.id === selectedId || spot.id === hoveredId;
            return (
              <AdvancedMarker
                key={spot.id}
                position={{ lat: spot.lat, lng: spot.lng }}
                title={spot.name}
                onClick={() => onSelect(spot.id)}
              >
                <div className={`spot-pin${active ? ' spot-pin--active' : ''}`} />
              </AdvancedMarker>
            );
          })}
          <RadiusCircle center={center} radiusKm={radiusKm} onRadiusChange={onRadiusChange} />
          <PanToSelected spots={spots} selectedId={selectedId} />
        </Map>
        {/* 中心クロスヘア（地図中心＝検索中心）。 */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="h-4 w-4 rounded-full border-2 border-blue-600 bg-white/70 shadow" />
        </div>
      </div>
    </APIProvider>
  );
}
