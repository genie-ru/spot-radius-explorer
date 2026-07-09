import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from '../cache/cache.module';
import { GEOCODING_PROVIDER, GeocodingProvider } from './geocoding-provider';

// 座標を小数3桁(≈110mグリッド)に丸めてキャッシュキーにする（近接リクエストを1エントリに集約）。
const COORD_PRECISION = 3;
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30日

export interface ReverseGeocodeResult {
  lat: number;
  lng: number;
  address: string | null;
  cached: boolean;
}

@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(GEOCODING_PROVIDER) private readonly provider: GeocodingProvider,
  ) {}

  // キャッシュ優先で逆ジオコーディング。ヒットすれば外部プロバイダを呼ばない。
  async reverse(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    const key = this.cacheKey(lat, lng);

    const hit = await this.redis.get(key);
    if (hit !== null) {
      this.logger.log(`cache HIT  ${key}（外部を呼ばない）`);
      return { lat, lng, address: hit, cached: true };
    }

    this.logger.log(`cache MISS ${key} → 外部プロバイダを呼び出し`);
    const address = await this.provider.reverse(lat, lng);
    if (address !== null) {
      await this.redis.set(key, address, 'EX', CACHE_TTL_SECONDS);
    }
    return { lat, lng, address, cached: false };
  }

  private cacheKey(lat: number, lng: number): string {
    return `geocode:${lat.toFixed(COORD_PRECISION)}:${lng.toFixed(COORD_PRECISION)}`;
  }
}
