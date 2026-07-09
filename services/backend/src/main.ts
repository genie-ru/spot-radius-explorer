import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // web(nginx) が /api を Nest にそのまま渡すため、グローバルプレフィックスを合わせる。
  app.setGlobalPrefix('api');
  // DTO を検証・変換（クエリ/ボディの型変換、未定義プロパティの拒否）。
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(8080, '0.0.0.0');
}
bootstrap();
