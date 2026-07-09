import { Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import {
  LATITUDE_RANGE,
  LONGITUDE_RANGE,
  MAX_RADIUS_KM,
  MAX_RESULT_LIMIT,
} from '../../common/geo.constants';

// GET /api/spots のリクエスト DTO（中心・半径・カテゴリ・件数）。
// ValidationPipe(transform) でクエリ文字列を数値化し、範囲・型を検証する。
export class FindSpotsQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(LATITUDE_RANGE.min)
  @Max(LATITUDE_RANGE.max)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(LONGITUDE_RANGE.min)
  @Max(LONGITUDE_RANGE.max)
  lng!: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Max(MAX_RADIUS_KM) // 半径の上限（km）。日本列島の端〜端＝任意の中心から全国を覆える
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
  @Max(MAX_RESULT_LIMIT) // 返却件数の上限
  limit?: number;
}
