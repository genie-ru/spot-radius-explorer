import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { DataSource } from 'typeorm';

// シード元CSV（backend イメージ同梱 / dev は bind マウント）。SEED_CSV_PATH で差し替え可。
const DEFAULT_SEED_DIR = 'seed';
const DEFAULT_SEED_FILE = 'spot_test_seed.csv';

// 緯度・経度の妥当範囲（地球の経度緯度の範囲内であるか）。
const LATITUDE_RANGE = { min: -90, max: 90 } as const;
const LONGITUDE_RANGE = { min: -180, max: 180 } as const;

// CSV の1行（ヘッダ: name, category, lat, long, address）。
interface RawCsvRow {
  name: string;
  category: string;
  address: string;
  lat: string;
  long: string;
}

// 検証済みのシード行。
interface SpotSeedRow {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
}

// app.spots 専用の冪等シーダー。
// マイグレーション後（TypeOrmModule 初期化後）の onApplicationBootstrap で実行され、
// app.spotsテーブルが空のときだけ CSV を投入する。2回目以降はスキップ。
// 別テーブルを投入したい場合は、このクラスを真似た別シーダー（例: ReviewsSeeder）を
// seed/ に追加し、SeedModule に登録する。各シーダーは自分のテーブルの空チェックを自分で持つ。
@Injectable()
export class SpotsSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(SpotsSeeder.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.countSpots();
    if (existing > 0) {
      this.logger.log(`spots に ${existing} 件あるためシードをスキップ`);
      return;
    }

    const rows = this.loadSeedRows();
    if (rows.length === 0) {
      this.logger.warn('シード対象が 0 件でした');
      return;
    }

    await this.insertSpots(rows);
    this.logger.log(`spots に ${rows.length} 件をシードしました`);
  }

  private async countSpots(): Promise<number> {
    const [{ count }]: Array<{ count: number }> = await this.dataSource.query(
      `SELECT count(*)::int AS count FROM app.spots`,
    );
    return count;
  }

  // CSV を読み、各行を検証して SpotSeedRow[] にする。
  private loadSeedRows(): SpotSeedRow[] {
    const path =
      process.env.SEED_CSV_PATH ??
      join(process.cwd(), DEFAULT_SEED_DIR, DEFAULT_SEED_FILE);

    const records: RawCsvRow[] = parse(readFileSync(path, 'utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((record) => this.validateRow(record));
  }

  private validateRow(record: RawCsvRow): SpotSeedRow {
    const lat = Number(record.lat);
    const lng = Number(record.long);

    if (!record.name || !record.category || !record.address) {
      throw new Error(`シード: 必須列が空です: ${JSON.stringify(record)}`);
    }
    if (!this.inRange(lat, LATITUDE_RANGE)) {
      throw new Error(`シード: 緯度が範囲外です: ${record.lat}`);
    }
    if (!this.inRange(lng, LONGITUDE_RANGE)) {
      throw new Error(`シード: 経度が範囲外です: ${record.long}`);
    }

    return {
      name: record.name,
      category: record.category,
      address: record.address,
      lat,
      lng,
    };
  }

  private inRange(value: number, range: { min: number; max: number }): boolean {
    return Number.isFinite(value) && value >= range.min && value <= range.max;
  }

  // 検証済み行をINSERTで投入する。
  // geom は必ず ST_MakePoint(経度, 緯度) の順で作る（CSV は lat, long の順なので取り違え注意）。
  private async insertSpots(rows: SpotSeedRow[]): Promise<void> {
    const params: unknown[] = [];
    const valuePlaceholders = rows.map((row) => {
      const base = params.length;
      params.push(row.name, row.category, row.address, row.lng, row.lat);
      return `($${base + 1}, $${base + 2}, $${base + 3}, ST_MakePoint($${base + 4}, $${base + 5})::geography)`;
    });

    await this.dataSource.query(
      `INSERT INTO app.spots (name, category, address, geom) VALUES ${valuePlaceholders.join(', ')}`,
      params,
    );
  }
}
