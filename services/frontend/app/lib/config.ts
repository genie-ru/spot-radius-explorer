// フロントの調整パラメータ（政策値）を一元管理。チューニングは「コード探し」でなく
// 「この値を変える」で済ませる。バックエンドと揃える値は由来を明記する。

// 初期表示（東京駅・半径5km）。
export const INITIAL_CENTER: { lat: number; lng: number } = {
  lat: 35.681236,
  lng: 139.767125,
};
export const INITIAL_RADIUS_KM = 5;

// 地図の初期ズーム。
export const DEFAULT_ZOOM = 12;

// 半径の下限・上限(km)。上限3000＝日本列島の端〜端。backend の @Max(3000) と一致させる。
export const MIN_RADIUS_KM = 0.1;
export const MAX_RADIUS_KM = 3000;

// 単位換算（km→m）。
export const METERS_PER_KM = 1000;

// debounce（ms）: 連続変化を間引く。
export const SEARCH_DEBOUNCE_MS = 400; // 半径検索（自前DB・地図移動）
export const RADIUS_DEBOUNCE_MS = 300; // 半径スライダー
export const ADDRESS_DEBOUNCE_MS = 400; // 中心住所（外部逆ジオ）

// 中心住所の空間ゲート粒度。小数3桁 ≈ 110m。backend のキャッシュキー精度と一致させる（要件3）。
export const COORD_SNAP_PRECISION = 3;

// デスクトップ判定の下限幅(px)。Tailwind の md ブレークポイントと一致。
export const DESKTOP_MIN_WIDTH_PX = 768;
