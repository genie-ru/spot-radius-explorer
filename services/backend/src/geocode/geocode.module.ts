import { Logger, Module } from '@nestjs/common';
import { GeocodeController } from './geocode.controller';
import { GeocodeService } from './geocode.service';
import { GEOCODING_PROVIDER } from './geocoding-provider';
import { GoogleProvider } from './providers/google.provider';

@Module({
  controllers: [GeocodeController],
  providers: [
    GeocodeService,
    {
      // 逆ジオコーディングは Google Geocoding API 一本。GEOCODING_API_KEY が必要。
      provide: GEOCODING_PROVIDER,
      useFactory: () => {
        const apiKey = process.env.GEOCODING_API_KEY ?? '';
        const logger = new Logger('GeocodeProvider');
        if (apiKey) {
          logger.log('Google Geocoding API を使用します');
        } else {
          logger.warn(
            'GEOCODING_API_KEY が未設定です。中心住所は取得できません（住所欄のみ非表示で継続）',
          );
        }
        return new GoogleProvider(apiKey);
      },
    },
  ],
})
export class GeocodeModule {}
