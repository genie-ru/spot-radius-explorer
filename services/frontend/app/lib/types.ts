export interface Spot {
  id: number;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  distanceM: number;
}

export interface SpotListResponse {
  items: Spot[];
  count: number;
}

export interface ReverseGeocodeResult {
  lat: number;
  lng: number;
  address: string | null;
  cached: boolean;
}
