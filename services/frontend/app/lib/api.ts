import type { ReverseGeocodeResult, SpotListResponse } from './types';

// ブラウザから nginx(web) 経由で NestJS(/api) を叩く。相対パスなので同一オリジン。

export async function fetchSpots(
  params: { lat: number; lng: number; radiusKm: number },
  signal?: AbortSignal,
): Promise<SpotListResponse> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radiusKm: String(params.radiusKm),
  });
  const res = await fetch(`/api/spots?${query}`, { signal });
  if (!res.ok) throw new Error(`GET /api/spots -> ${res.status}`);
  return res.json();
}

export async function reverseGeocode(
  params: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
  });
  const res = await fetch(`/api/geocode/reverse?${query}`, { signal });
  if (!res.ok) throw new Error(`GET /api/geocode/reverse -> ${res.status}`);
  return res.json();
}
