# base: dev は初期化SQLを bind マウント / prod: 焼き込み
# PostGIS 同梱の公式 alpine 版（PG18 + PostGIS 3.6）。素の postgres には PostGIS が無く
# CREATE EXTENSION postgis が失敗するため、空間検索(ST_DWithin/GiST)の土台としてこれを使う。
FROM postgis/postgis:18-3.6-alpine AS base

FROM base AS prod
COPY services/db/ /docker-entrypoint-initdb.d
