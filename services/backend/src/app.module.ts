import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from './cache/cache.module';
import { dataSourceOptions } from './config/data-source';
import { GeocodeModule } from './geocode/geocode.module';
import { HealthController } from './health.controller';
import { SeedModule } from './seed/seed.module';
import { SpotsModule } from './spots/spots.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 起動時に未適用マイグレーションを実行（migrationsRun）。テーブル作成後にシードが走る。
    TypeOrmModule.forRoot({ ...dataSourceOptions, migrationsRun: true }),
    CacheModule,
    SpotsModule,
    SeedModule,
    GeocodeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
