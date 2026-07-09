# doc — 開発メモ

開発・動作確認用のコマンドと API リファレンス。提出用の説明はリポジトリ直下の [`README.md`](../README.md) を参照。

> 以下のコマンドは **リポジトリ直下**で実行できます（ルートの `compose.yaml` が `docker/` の定義を読み込むため `cd` 不要）。

## geom 変換の動作確認

CSV の `lat` / `long` が `geom`(geography) に正しく変換されるかを確認するチェックスクリプト。
**一時テーブルだけを使う非破壊の確認で、`spots` などの実テーブルには一切書き込みません。**
使った一時テーブルはセッション終了時に自動で消えるため、実行後の DB の状態は実行前と同じです。

```bash
docker compose exec db \
  psql -U mobility -d mobility -f /docker-entrypoint-initdb.d/checks/verify_geom.sql
```

## マイグレーション

**通常は不要**です。Backend 起動時に未適用マイグレーションが自動実行されます（`migrationsRun: true`）。
手動で明示的に実行・巻き戻したいときのみ以下を使います（`dist` を読むため先にビルド）。

```bash
docker compose exec backend sh -c 'pnpm build && pnpm migration:run'      # 適用
docker compose exec backend sh -c 'pnpm build && pnpm migration:revert'   # 直近1件を巻き戻し
```

## スポット半径検索 API

中心（緯度・経度）と半径を渡すと、範囲内のスポットを**近い順**に返す。

```
GET /api/spots?lat=&lng=&radiusKm=&categories=&limit=
```

リクエスト例（東京駅から半径 3km）:

```bash
curl -G http://localhost/api/spots \
  --data-urlencode "lat=35.681236" \
  --data-urlencode "lng=139.767125" \
  --data-urlencode "radiusKm=3"
```

レスポンス例:

```json
{
  "items": [
    { "id": 3, "name": "東京駅", "category": "交通機関", "address": "東京都千代田区", "lat": 35.681236, "lng": 139.767125, "distanceM": 0 },
    { "id": 8, "name": "皇居（江戸城跡）", "category": "歴史的建造物", "address": "東京都千代田区", "lat": 35.685175, "lng": 139.752799, "distanceM": 1368 }
  ],
  "count": 2
}
```

### クエリパラメータ

| パラメータ | 必須 | 意味 | 制約 |
|---|---|---|---|
| `lat` | ✅ | 検索中心の緯度 | -90〜90 |
| `lng` | ✅ | 検索中心の経度 | -180〜180 |
| `radiusKm` | ✅ | 半径（km） | 0 超〜3000 |
| `categories` | 任意 | カテゴリ絞り込み（カンマ区切りで複数可） | — |
| `limit` | 任意 | 返却件数の上限（近い順に N 件） | 1〜500 |

- `items` は `distanceM`（中心からの距離・メートル）の**昇順**。`count` は件数。
- 不正な入力（必須欠落・範囲外・数値でない等）は `400 Bad Request`。
