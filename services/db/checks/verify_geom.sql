-- lat/long カラムが geom(geography) に正しく載るかの動作確認。
--
-- これはテスト／動作確認用であり、本番シードではない。
-- checks/ サブディレクトリに置くため docker-entrypoint-initdb.d では自動実行されない。
-- 手動実行:
--   docker compose exec -T db \
--     psql -U mobility -d mobility -f /docker-entrypoint-initdb.d/checks/verify_geom.sql
--
-- spots テーブルには一切書き込まない（一時テーブルで検算するだけ）。

\set ON_ERROR_STOP on

CREATE TEMP TABLE stage(
  name text, category text, lat double precision, long double precision, address text
);

COPY stage FROM '/docker-entrypoint-initdb.d/seed/spot_test_seed.csv' WITH (FORMAT csv, HEADER true);

-- サンプル表示: geom の WKT と、そこから復元した緯度経度・SRID が元の値と一致するか目視。
SELECT
  name,
  lat, long,
  ST_AsText(geom)                         AS geom_wkt,
  round(ST_Y(geom::geometry)::numeric, 6) AS geom_lat,
  round(ST_X(geom::geometry)::numeric, 6) AS geom_lon,
  ST_SRID(geom::geometry)                 AS srid
FROM (
  SELECT name, lat, long, ST_MakePoint(long, lat)::geography AS geom FROM stage
) t
ORDER BY name
LIMIT 5;

-- 検算: 緯度経度の取り違え(逆転)や SRID 不一致が 1 件でもあれば例外で落とす。
DO $$
DECLARE
  total     int;
  bad_coord int;
  bad_srid  int;
BEGIN
  SELECT count(*) INTO total FROM stage;

  SELECT count(*) INTO bad_coord
  FROM stage
  WHERE round(ST_Y(ST_MakePoint(long, lat))::numeric, 6) <> round(lat::numeric, 6)
     OR round(ST_X(ST_MakePoint(long, lat))::numeric, 6) <> round(long::numeric, 6);

  SELECT count(*) INTO bad_srid
  FROM stage
  WHERE ST_SRID(ST_MakePoint(long, lat)::geography::geometry) <> 4326;

  IF bad_coord > 0 OR bad_srid > 0 THEN
    RAISE EXCEPTION 'geom 検証 NG: 座標不一致=% 件 / SRID不一致=% 件 (total=%)',
      bad_coord, bad_srid, total;
  END IF;

  RAISE NOTICE 'geom 検証 OK: % 件すべて lat/long -> geom(SRID 4326) が一致', total;
END $$;
