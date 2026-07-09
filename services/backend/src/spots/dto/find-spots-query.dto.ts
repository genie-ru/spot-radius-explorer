import { Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

// 半径検索用リクエスト DTO
// 現時点の GET /api/spots は全件返すため未使用。半径検索を実装する際に
// コントローラで @Query() として受け、ValidationPipe(transform) で数値化・検証する。
export class FindSpotsQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Max(3000) // 半径の上限キャップ（km）。日本列島の端〜端（約3000km）= 任意の中心から全国を覆える
  radiusKm!: number;

  // categories=公園,神社 のようなカンマ区切りを配列へ。
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : value,
  )
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Max(500) // 返却件数の上限キャップ
  limit?: number;
}
