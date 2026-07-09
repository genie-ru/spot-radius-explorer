import { useEffect, useRef, useState } from 'react';
import { reverseGeocode } from '../lib/api';
import { ADDRESS_DEBOUNCE_MS, COORD_SNAP_PRECISION } from '../lib/config';
import { useDebouncedValue } from './useDebouncedValue';

function snapKey(lat: number, lng: number): string {
  return `${lat.toFixed(COORD_SNAP_PRECISION)},${lng.toFixed(COORD_SNAP_PRECISION)}`;
}

// 中心地点の住所を、外部呼び出しを最小化しつつ返す
//   1. debounce      … 移動が止まってから
//   2. 空間ゲート     … 量子化セルが変わらなければ何もしない（＝わずかな移動では叩かない）
//   3. メモリキャッシュ … 同じセルは端末内で即返す（2層目キャッシュ。1層目は Valkey）
//   4. Abort         … セル切替時に進行中の要求を中断
export function useCenterAddress(center: { lat: number; lng: number }): {
  address: string | null;
  loading: boolean;
} {
  const debounced = useDebouncedValue(center, ADDRESS_DEBOUNCE_MS);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cacheRef = useRef<Map<string, string | null>>(new Map());
  const lastKeyRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const key = snapKey(debounced.lat, debounced.lng);

    // 空間ゲート: セルが変わっていなければ何もしない（通信もしない）。
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    // 2層目キャッシュ: ヒットなら即表示、通信しない。
    if (cacheRef.current.has(key)) {
      controllerRef.current?.abort();
      setAddress(cacheRef.current.get(key) ?? null);
      setLoading(false);
      return;
    }

    // ミス: 進行中の要求を中断してから新規取得。
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    reverseGeocode({ lat: debounced.lat, lng: debounced.lng }, controller.signal)
      .then((res) => {
        cacheRef.current.set(key, res.address);
        if (!controller.signal.aborted) setAddress(res.address);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setAddress(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, [debounced.lat, debounced.lng]);

  // アンマウント時に進行中の要求を中断。
  useEffect(() => () => controllerRef.current?.abort(), []);

  return { address, loading };
}
