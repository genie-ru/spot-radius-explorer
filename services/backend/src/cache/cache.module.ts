import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

// Valkey(Redis 互換) クライアントの注入トークン。
export const REDIS = Symbol('REDIS');

// アプリ全体で共有する Valkey 接続を提供する。@Global なので各モジュールで import 不要。
@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (): Redis => new Redis(process.env.REDIS_URL ?? 'redis://cache:6379'),
    },
  ],
  exports: [REDIS],
})
export class CacheModule implements OnModuleDestroy {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  onModuleDestroy(): void {
    this.redis.disconnect();
  }
}
