# base: dev は初期化SQLを bind マウント / prod: 焼き込み
# PostGIS 同梱（PG18 + PostGIS 3.6）。素の postgres には PostGIS が無く CREATE EXTENSION postgis が
# 失敗するため、空間検索(ST_DWithin/GiST)の土台としてこれを使う。
# 公式 postgis/postgis は amd64 のみ publish で arm64 マシンだと "no match for platform" になるため、
# 中身互換のマルチアーチ・ミラー(imresamu/postgis, PostGIS 公式が arm64 用に案内している版)を使う。
FROM imresamu/postgis:18-3.6-alpine AS base

FROM base AS prod
COPY services/db/ /docker-entrypoint-initdb.d
