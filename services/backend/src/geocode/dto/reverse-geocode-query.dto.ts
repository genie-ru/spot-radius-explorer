import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';
import { LATITUDE_RANGE, LONGITUDE_RANGE } from '../../common/geo.constants';

// GET /api/geocode/reverse のクエリ。地図中心の緯度経度。
export class ReverseGeocodeQueryDto {
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
}
