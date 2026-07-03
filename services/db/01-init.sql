-- 初回起動時のみ実行される（データボリュームが空のとき）。
-- スキーマ・拡張の初期化はここに追記する。マイグレーションは api 側で管理する想定。

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 空間検索(半径検索)の土台。spots.geom を geography(Point,4326) で持ち、
-- GiST インデックス + ST_DWithin で「半径N km以内」を DB 側で処理する。
CREATE EXTENSION IF NOT EXISTS postgis;

-- アプリのマイグレーションが使う専用スキーマ
CREATE SCHEMA IF NOT EXISTS app;
