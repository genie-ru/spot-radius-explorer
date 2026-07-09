// 逆ジオコーディングのプロバイダ抽象。現在の実装は Google Geocoding のみ（差し替え可能な形で保持）。
export interface GeocodingProvider {
  // 緯度経度から整形済み住所を返す。取得できなければ null。
  reverse(lat: number, lng: number): Promise<string | null>;
}

// プロバイダ実装を注入するためのトークン。
export const GEOCODING_PROVIDER = Symbol('GEOCODING_PROVIDER');
