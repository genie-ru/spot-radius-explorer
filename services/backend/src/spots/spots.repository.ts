import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Spot } from './spot.entity';

// QueryBuilder が返す生の行。geom は lat/lng に展開済み（pg は id=bigint を文字列で返す）。
export interface SpotRawRow {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  distance_m: number;
}

// 半径検索の入力（検証済みの値）。
export interface RadiusQuery {
  lat: number;
  lng: number;
  radiusKm: number;
  categories?: string[];
  limit?: number;
}

// 検索中心の geography。:lat/:lng はバインドパラメータ（値のみ）で、SQL式は固定なので安全。
const CENTER = 'ST_MakePoint(:lng, :lat)::geography';
const METERS_PER_KM = 1000;

// スポットの永続化アクセスを集約する層。PostGIS 依存の生SQL断片
// （ST_MakePoint / ST_DWithin / ST_Distance / ST_X / ST_Y）はすべてここに閉じ込める。
@Injectable()
export class SpotsRepository {
  constructor(
    @InjectRepository(Spot) private readonly repo: Repository<Spot>,
  ) {}

  // 中心(lat,lng)から radiusKm 以内のスポットを、近い順（距離昇順）に取得する。
  async findWithinRadius(query: RadiusQuery): Promise<SpotRawRow[]> {
    const radiusMeters = query.radiusKm * METERS_PER_KM;

    const qb = this.repo
      .createQueryBuilder('s')
      .select('s.id', 'id')
      .addSelect('s.name', 'name')
      .addSelect('s.category', 'category')
      .addSelect('s.address', 'address')
      .addSelect('ST_Y(s.geom::geometry)', 'lat')
      .addSelect('ST_X(s.geom::geometry)', 'lng')
      .addSelect(`ST_Distance(s.geom, ${CENTER})`, 'distance_m')
      .where(`ST_DWithin(s.geom, ${CENTER}, :radiusMeters)`)
      .orderBy('distance_m', 'ASC')
      .setParameters({ lat: query.lat, lng: query.lng, radiusMeters });

    // カテゴリ指定があるときだけ絞り込む（複数可）。
    if (query.categories && query.categories.length > 0) {
      qb.andWhere('s.category = ANY(:categories)', { categories: query.categories });
    }

    // 件数上限が指定されていれば適用（近い順なので「近い方から N 件」になる）。
    if (query.limit != null) {
      qb.limit(query.limit);
    }

    return qb.getRawMany<SpotRawRow>();
  }
}
