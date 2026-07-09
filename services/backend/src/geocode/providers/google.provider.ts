import { Logger } from '@nestjs/common';
import { GeocodingProvider } from '../geocoding-provider';

// Google Geocoding API 実装（本アプリの逆ジオコーディングはこれ一本）。
// キーは環境変数からサーバ側にのみ渡り、クライアントには出さない（課題7）。
// キー未設定や API エラー時は null を返し、住所欄のみ「取得できません」表示にして処理を継続する。
export class GoogleProvider implements GeocodingProvider {
  private readonly logger = new Logger(GoogleProvider.name);
  private readonly endpoint = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor(private readonly apiKey: string) {}

  async reverse(lat: number, lng: number): Promise<string | null> {
    if (!this.apiKey) {
      this.logger.warn('GEOCODING_API_KEY が未設定のため住所を取得できません');
      return null;
    }

    const url = `${this.endpoint}?latlng=${lat},${lng}&language=ja&key=${this.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      this.logger.warn(`Google Geocoding が HTTP ${res.status} を返しました`);
      return null;
    }

    const data = (await res.json()) as {
      status?: string;
      error_message?: string;
      results?: Array<{ formatted_address?: string }>;
    };
    // Google は HTTP 200 でも status で失敗（REQUEST_DENIED 等）を返す。
    if (data.status !== 'OK') {
      this.logger.warn(`Google Geocoding status=${data.status} ${data.error_message ?? ''}`);
      return null;
    }
    return data.results?.[0]?.formatted_address ?? null;
  }
}
