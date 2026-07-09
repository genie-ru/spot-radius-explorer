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
}

// スポットの永続化アクセスを集約する層。PostGIS 依存の生SQL断片（ST_Y/ST_X, 後の ST_DWithin）は
// すべてここに閉じ込め、Service からは型付きメソッドとして扱えるようにする。
@Injectable()
export class SpotsRepository {
  constructor(
    @InjectRepository(Spot) private readonly repo: Repository<Spot>,
  ) {}

  // 全スポットを取得。geography(Point) を ST_Y/ST_X で緯度経度に展開する。
  async findAllProjected(): Promise<SpotRawRow[]> {
    return this.repo
      .createQueryBuilder('s')
      .select('s.id', 'id')
      .addSelect('s.name', 'name')
      .addSelect('s.category', 'category')
      .addSelect('s.address', 'address')
      .addSelect('ST_Y(s.geom::geometry)', 'lat')
      .addSelect('ST_X(s.geom::geometry)', 'lng')
      .orderBy('s.id', 'ASC')
      .getRawMany<SpotRawRow>();
  }
}
