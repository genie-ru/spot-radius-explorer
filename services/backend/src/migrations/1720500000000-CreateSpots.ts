import { MigrationInterface, QueryRunner } from 'typeorm';

// app.spots テーブルと空間/カテゴリインデックスを作成する（設計メモ 1 準拠）。
// 拡張・スキーマは 01-init.sql でも作られるが、初期化スクリプトを介さない DB でも
// このマイグレーション単体で完結するよう IF NOT EXISTS で冪等に張り直す。
export class CreateSpots1720500000000 implements MigrationInterface {
  name = 'CreateSpots1720500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS app`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
    await queryRunner.query(`
      CREATE TABLE app.spots (
        id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name     text NOT NULL,
        category text NOT NULL,
        address  text NOT NULL,
        geom     geography(Point, 4326) NOT NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX spots_geom_gix ON app.spots USING gist (geom)`);
    await queryRunner.query(`CREATE INDEX spots_category_idx ON app.spots (category)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS app.spots`);
  }
}
