# doc — 学習・調査記録

docker compose exec db psql -U mobility -d mobility


### geom 変換の動作確認

CSV の `lat` / `long` が `geom`(geography) に正しく変換されるかを確認するチェックスクリプト。
**一時テーブルだけを使う非破壊の確認で、`spots` などの実テーブルには一切書き込みません。**
使った一時テーブルはセッション終了時に自動で消えるため、実行後の DB の状態は実行前と同じです。

```bash
# docker/ ディレクトリで実行
docker compose exec db psql -U mobility -d mobility -f /docker-entrypoint-initdb.d/checks/verify_geom.sql
```