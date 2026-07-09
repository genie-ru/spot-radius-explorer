# spot-radius-explorer（位置情報探索アプリ）

提供されたスポットデータをデータベースへ自動インポートし、地図上で **半径検索**・**リスト連動**・**地図中心地点の住所リアルタイム表示** を行うフルスタック Web アプリケーションです。

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS + Google Maps JavaScript API（`@vis.gl/react-google-maps`）+ framer-motion
- **Backend:** NestJS + TypeORM
- **Database:** PostgreSQL 18 + PostGIS 3.6
- **Cache:** Valkey（Redis 互換）— 逆ジオコーディング結果の共有キャッシュ
- **Infra:** Docker / Docker Compose
- **Language:** TypeScript

---

## 環境構築

### 前提

- Docker / Docker Compose が動作する環境（Docker Desktop など）
- ホストに Node.js / pnpm は不要（すべて Docker 内で完結）

### 手順

1. リポジトリを取得します。

   ```bash
   git clone <this-repo-url>
   cd spot-radius-explorer
   ```

2. 環境変数ファイルを用意します。機密情報はリポジトリに含めていないため、`.env.example` をコピーして値を埋めてください（`docker/.env` は `.gitignore` 済み）。

   ```bash
   cp docker/.env.example docker/.env
   ```

   | 変数 | 用途 | 必須 |
   |---|---|---|
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | 地図表示（Google Maps JavaScript API・**ブラウザ側**） | **地図表示に必須** |
   | `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | AdvancedMarker 用の Map ID | 任意（未設定なら `DEMO_MAP_ID`） |
   | `GEOCODING_API_KEY` | 逆ジオコーディング（中心住所・**サーバ側**） | 中心住所の表示に必要 ※ |

   > ⚠️ **地図は Google Maps のブラウザ用 API キーが必須**です。GCP で **「Maps JavaScript API」を有効化**し、**HTTP リファラ制限**（例: `http://localhost/*`）を付けたキーを `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` に設定してください。未設定でもアプリは起動し、**リスト検索・中心住所表示は動作**しますが、地図パネルはキー設定を促すメッセージ表示になります。
   >
   > ※ 中心住所の**逆ジオコーディングは Google Geocoding API を使用**します。`GEOCODING_API_KEY` が無い場合は、**中心住所だけ「取得できません」表示になり、アプリの起動・地図・スポット検索は通常どおり動作します**（失敗しても全体を止めない）。**サーバ側キーでブラウザには露出しません**。地図用のブラウザキー（リファラ制限）とは**別のキー**にすることを推奨します（保護方法が異なるため。後述「技術的な判断」参照）。

---

## 実行手順

### 起動（`docker compose up` 一発）

> **リポジトリ直下**で実行します。ルート直下の `compose.yaml` が `docker/docker-compose.yml` を読み込むため、`docker compose up` 一発で起動します（`cd` 不要）。

```bash
docker compose up -d --build
# もしくは（Makefile 経由。中身は同じ）
make up
```

- **DB（PostgreSQL/PostGIS）→ Cache（Valkey）→ Backend（NestJS）→ Frontend（Next.js）→ Web（nginx）** の順に依存関係を解決して起動します。
- **シードデータ（`spot_test_seed.csv`、200 件）は初回起動時に自動インポート**されるため、起動直後から動作可能です（詳細は「データインポートの仕組み」節）。

### アクセス

| 画面 / エンドポイント | URL |
|---|---|
| アプリ本体（地図＋リスト） | <http://localhost/> |
| API ヘルスチェック | <http://localhost/api/health> |
| スポット半径検索 API | `GET http://localhost/api/spots?lat=&lng=&radiusKm=&categories=&limit=` |
| 中心住所（逆ジオコーディング） | `GET http://localhost/api/geocode/reverse?lat=&lng=` |

### API 使用例（curl・東京駅中心）

**① 半径検索** — 東京駅（`lat=35.681236, lng=139.767125`）から半径 3km:

```bash
curl -G http://localhost/api/spots \
  --data-urlencode "lat=35.681236" \
  --data-urlencode "lng=139.767125" \
  --data-urlencode "radiusKm=3"
```

```json
{
  "items": [
    { "id": 3, "name": "東京駅", "category": "交通機関", "address": "東京都千代田区", "lat": 35.681236, "lng": 139.767125, "distanceM": 0 },
    { "id": 8, "name": "皇居（江戸城跡）", "category": "歴史的建造物", "address": "東京都千代田区", "lat": 35.685175, "lng": 139.752799, "distanceM": 1368 }
  ],
  "count": 2
}
```

カテゴリ・件数上限つき（`categories` はカンマ区切り・日本語は URL エンコード）:

```bash
curl -G http://localhost/api/spots \
  --data-urlencode "lat=35.681236" --data-urlencode "lng=139.767125" \
  --data-urlencode "radiusKm=5" --data-urlencode "categories=交通機関" --data-urlencode "limit=10"
```

**② 中心住所（逆ジオコーディング）**:

```bash
curl -G http://localhost/api/geocode/reverse \
  --data-urlencode "lat=35.681236" --data-urlencode "lng=139.767125"
```

```json
{ "lat": 35.681236, "lng": 139.767125, "address": "日本、〒100-0005 東京都千代田区丸の内１丁目９−１ JR 東京駅", "cached": false }
```

- `items` は `distanceM`（中心からの距離・メートル）の**昇順**。`count` は件数。
- 逆ジオの `address` は Google Geocoding の表記（`GEOCODING_API_KEY` 未設定時は `address` が `null`）。`cached` は Valkey キャッシュからの再利用かどうか。
- `lat`/`lng`/`radiusKm` は必須。範囲外や欠落など不正な入力は **`400`** を返します（`radiusKm` は 0 超〜3000）。

### 停止

```bash
make down
# もしくは
docker compose -f docker/docker-compose.yml down      # コンテナ停止
docker compose -f docker/docker-compose.yml down -v   # DB/キャッシュのボリュームも削除（再シードしたいとき）
```

### データインポートの仕組み

- DB コンテナ初回起動時、`docker-entrypoint-initdb.d` により PostGIS 拡張の有効化と `app` スキーマ作成を行います。
- Backend 起動時に **TypeORM マイグレーション**（`migrationsRun`）で `app.spots` テーブルと GiST/btree インデックスを作成し、続いて **`spots` が空であれば CSV を一括投入するシード**が走ります（**冪等**：件数チェックで 2 回目以降はスキップ）。
- 座標の取り違え防止のため、CSV は `lat, long` 順ですが geom は必ず `ST_MakePoint(経度, 緯度)` の順で生成します。
- 再インポートしたい場合は `down -v` でボリュームを削除してから再度 `up` してください。
- ※ 課題文では「約 500 件」とありますが、提供シードは **200 件** です（200 件での実測 API 往復 ≈ 3ms・下記「工夫した点 §1」参照）。設計は件数増加に耐える形（`geography` 型 + GiST 空間インデックス）にしてあり、件数が増えても `ST_DWithin` ＋ 空間インデックスで実用的な速度を保てる想定です。

---

## 使用した主要ライブラリとその選定理由

| ライブラリ / 技術 | 選定理由 |
|---|---|
| **Next.js 16 (App Router)** | Server/Client 境界を分け、ページ（`page.tsx`）はサーバーのまま、対話ロジックは `"use client"` の機能コンポーネントに閉じ込められる。ルーティング・メタデータも標準装備。 |
| **Tailwind CSS** | UI の目的は装飾より直感的な操作性。ユーティリティで素早くレイアウトを組め、コンポーネント間のスタイル一貫性を保ちやすい。 |
| **Google Maps JavaScript API（`@vis.gl/react-google-maps`）** | 地図表示に採用。**`google.maps.Circle` の editable による半径円のドラッグ伸縮**や `AdvancedMarker` を React 宣言的に扱える。中心住所の逆ジオコーディングも Google（Geocoding API）に統一。（キー必須のトレードオフは「今後の改善点」参照） |
| **framer-motion** | リストの並び替えを FLIP（`layout`）アニメーションで滑らかに表現。近い順が変わったときに「パッと一新」ではなく要素が移動して見える。 |
| **NestJS** | モジュール／DI により責務分離が明快。Controller–Service–Repository の層構造で検索ロジック・キャッシュ・外部 API 呼び出しを分離でき、テスト容易性が高い。 |
| **TypeORM** | NestJS との統合が厚く、**マイグレーションでスキーマを version 管理**できる。PostGIS の `geography` 型・空間関数も QueryBuilder + 生 SQL 断片で扱える。 |
| **PostgreSQL + PostGIS** | 半径検索を **DB 側の空間インデックス（GiST）＋ `ST_DWithin`** で処理でき、200 件はもちろん数万件規模へスケールしても高速。距離計算をアプリ層に持ち込まず正確・効率的に行える。 |
| **Valkey（Redis 互換）+ ioredis** | 逆ジオコーディング結果の**サーバ側共有キャッシュ**。Valkey は **2024 年の Redis ライセンス変更（BSD → SSPL/RSAL で OSI 非準拠化）を受け、Linux Foundation が Redis 7.2 系から派生させた BSD ライセンスの互換フォーク**。主要クラウド・Linux ディストリが標準採用しつつあり、RESP 完全互換で ioredis もそのまま使える。座標を丸めたキーで全ユーザ横断に再利用して外部 API 呼び出しを削減し、AOF/RDB で再起動をまたいで永続。 |

---

## 実装時に特に工夫した点、および技術的な判断を行った箇所

### 1. 半径検索は DB（PostGIS）側で完結させる

`spots.geom` を `geography(Point, 4326)` として持ち、**GiST 空間インデックス**を張ったうえで `ST_DWithin(geom, :center, :radiusMeters)` で抽出、`ST_Distance` で近い順に返します。距離計算が正確（球面距離）でインデックスが効くためデータ増加に強く、`geometry` ではなく `geography` を採用することで km がそのまま扱えます。PostGIS 依存の生 SQL 断片（`ST_MakePoint`/`ST_DWithin`/`ST_Distance`/`ST_X`/`ST_Y`）は **`SpotsRepository` の中だけ**に閉じ込め、Service/Controller には漏らしていません。

> 実測（200 件・東京駅から半径 3km）：`EXPLAIN` で **GiST インデックス `spots_geom_gix` を使った Index Scan** で実行されることを確認。**API 往復（nginx → NestJS → PostGIS）はウォームで約 3ms**（初回のコールドは約 33ms）。件数が増えても空間インデックスが効くため、この方式のままスケールできます。

### 2. 「②周辺検索」と「③中心住所表示」でトリガー戦略を分けた

②検索と③住所表示は同じ「地図移動」を起点にしますが、**呼び出す先のコスト構造が違う**ため別方式にしています。②は自前 DB でほぼ無料、③は回数制限・課金のある外部 API です。

| | ② 半径検索 | ③ 中心住所表示 |
|---|---|---|
| 叩く先 | 自前 PostGIS（実質無料） | 外部逆ジオコーディング API（回数上限・課金あり） |
| トリガー | **地図移動で自動検索（debounce のみ）** | debounce＋空間ゲート＋2 層キャッシュ |

- **②をボタン式にしなかった判断**：定番の「このエリアで検索」ボタンも検討しましたが、②は自前 DB でほぼ無料のため**ボタンでコストを抑える動機が働きません**。カジュアルな発見型探索では「動かしたら即反映」が直感的なので**自動検索**を採用。呼び出しを絞る工夫を入れるべきなのは、**回数制限・課金のある外部逆ジオコーディング（③）だけ**、という一点に整理しました。

### 3. 逆ジオコーディング（③）の呼び出し頻度抑制 ＋ 2 層キャッシュ（歓迎要件）

「地図を動かすたびに住所を更新」しつつコストを抑えるため、多段で呼び出しを削っています。

1. **デバウンス**：移動が止まってから発火（連続ドラッグ中は呼ばない）。
2. **空間ゲート**：中心座標を **約 110m グリッド（小数 3 桁）に量子化**し、**セルが変わらなければ通信そのものを行わない**（＝わずかな移動ではバックエンドにも到達しない）。粒度 110m は「緯度 1 度 ≈ 111km」から導出し、住所が変わらない街区スケールに合わせています。
3. **2 層キャッシュ**：1 層目＝クライアント内メモリ、2 層目＝**Valkey（サーバ側・TTL 30 日）**。丸めた座標をキーに**過去の結果を再利用**し、同一エリアの再訪は外部を呼ばず即時表示。
4. **古い結果で画面を上書きしない**：地図を続けて動かすと住所取得のリクエストが次々に飛びます。新しいリクエストを出すとき、**まだ返事が来ていない前のリクエストを取り消し**ます。取り消さないと、遅れて届いた「前の場所」の住所が、いま見ている「新しい場所」の表示を上書きしてしまうためです（この通信の取り消しに、ブラウザ標準の `AbortController` を使用）。

実機のログで「近接点は同一キーに集約（HIT）／新セルのみ 1 回（MISS）／パン中の中間は呼ばない」を確認しています。

### 4. 逆ジオコーディングのプロバイダ抽象と失敗時のフォールバック

外部呼び出しは `GeocodingProvider` インターフェースの背後に隠し、実装を差し替え可能にしています（現在は **Google Geocoding 一本**）。**キーはサーバ側の `.env`（gitignore 済み）にのみ保持しブラウザに露出しません**。`GEOCODING_API_KEY` 未設定や API エラー時は `null` を返し、**中心住所だけ「取得できません」表示にして、地図・スポット検索などアプリ全体は動作を継続**します（一部の失敗で画面全体を止めない）。

### 5. 地図とリストの単方向データフロー

中心座標・半径（＋カテゴリ）を**単一の状態源**として持ち、そこからマーカー（地図）とスポット一覧（リスト）を派生。地図移動 → 状態更新 → 両者が同じ結果で再描画、という一方向にすることで**表示ズレを構造的に防止**。リスト項目のホバー／クリックで対応マーカーを強調、クリックでその地点へ地図をパンする連動も同じ状態を介して実現しています。半径円は `editable` でドラッグ伸縮でき、スライダーと双方向同期します。

### 6. UX（ローディング・ゼロ件・レスポンシブ）

- 検索中・住所取得中は**スケルトン／取得中表示**でフィードバック。
- 半径内 0 件のときは空リストでなく、**明示メッセージ＋「半径を広げる」導線**。
- **PC は左ドロワー／スマホは下部ボトムシート**にレスポンシブ切替。リストの並び替えは FLIP アニメーションで滑らかに。

### 7. 調整用の設定値を 1 ファイルに集約・機密情報の扱い

- debounce の待ち時間・空間ゲートの粒度・半径の上限・初期表示位置などの**チューニング用の定数を `app/lib/config.ts` にまとめ**、各値に根拠コメントを付けています。コード中にマジックナンバーを散らさず、調整を「コードを探して直す」ではなく「設定値を 1 か所変える」で済ませられます。半径上限（3000km）は backend の検証（`@Max`）と同じ値を単一の出所から参照しています。
- API キーは一切コミットせず、`docker/.env.example` にキー名のみ記載。**サーバ側キー（Geocoding）はブラウザに露出せず、ブラウザ側キー（Maps）はリファラ制限で保護**、という保護方法の違いを踏まえて別キー運用を推奨しています。

### 8. コンテナ・CI 周りの工夫

- **マルチステージ Docker**：dev はソースを bind マウントしてホットリロード、prod は **distroless・非 root** の最小イメージ（frontend は Next standalone、backend は `dist` のみ）。開発体験と本番の軽さ・安全性を両立。
- **`docker compose up` 一発で完結**：healthcheck による依存順起動（DB→Cache→Backend→Frontend→Web）＋起動時の自動マイグレーション・冪等シードで、**手順書なしに初期状態から動く**。
- **ビルドコンテキストと秘密の分離**：`.dockerignore` は whitelist 方式で **`.env` や `.pnpm-store` を除外**（イメージに秘密を焼かない・転送を軽く）。`NEXT_PUBLIC_*`（公開・ビルド時）と**サーバ秘密（実行時注入）**を分け、本番は build-arg／ランタイム env で使い分け。
- **CI（GitHub Actions）を多層で**：
  - `code.yml` … backend/frontend の **lint / format / typecheck**（`--frozen-lockfile` で lockfile ズレも検知）。
  - `docker.yml` … **hadolint**（Dockerfile lint）＋ **Trivy**（イメージ脆弱性を HIGH/CRITICAL で fails）＋ **本番スタックのスモークテスト**：実際にビルド・起動し、`/api/health` に加え **`/api/spots` が 1 件以上返るか**を検証。これで **①データ自動インポート（migration＋seed）と ②半径検索（PostGIS `ST_DWithin`）が本番ビルドで通っている**ことを毎回確認できる。※ **③逆ジオコーディングは外部 API（Google Geocoding）依存かつキー必須で CI が不安定になるため対象外**とし、キャッシュ挙動はローカルのログで別途確認している。

---

## 時間が足りず実装を簡略化した箇所・今後の改善点

### UI/UX
- **初回ロードのローディング表示が無い**：起動直後、地図の初期化＋最初の検索（外部含め体感 1〜2 秒）の間、**地図中心のクロスヘア（点）だけが表示され、読み込み中のフィードバックが無い**。リスト側はスケルトンを出すが、パネルを閉じた全画面地図（スマホ既定）では無表示。初回はマップ上にスピナー／オーバーレイを出して「準備中」を明示したい。

### テスト
- **E2E / コンポーネントテストが未整備**。品質担保は typecheck / lint / build ＋ 本番スモーク（CIでビルド・起動・主要エンドポイント疎通まで）に留まる。本来は **Playwright での E2E**（地図移動→半径検索→リスト連動）、**React Testing Library でのコンポーネントテスト**、backend の**ユニット**（半径境界値・冪等シード・キャッシュ HIT/MISS）を用意したい。

### アクセシビリティ・国際化
- **視覚障害者向け a11y が最小限**（キーボード操作・スクリーンリーダー・コントラスト比・`aria-*` の作り込み）。
- **多言語対応（i18n）未対応**（UI は日本語固定）。住所表記の言語も現状 `ja` 固定。
- **RTL（アラビア語など右→左レイアウト）未対応**。

### 運用・データベース
- **DB メンテナンスのバッチが未整備**（`REINDEX` / `VACUUM (ANALYZE)` / 統計更新の定期ジョブ等）。現状は起動時のバルク INSERT シードのみで大量更新機能は無いが、運用では定期メンテナンスを入れたい。
- **バックアップ・リストア戦略未整備**。**本番のマルチインスタンス構成**も未実装（Valkey 共有キャッシュ対応済みで土台はある）。

### パフォーマンス・コスト
- **逆ジオコーディングの日次上限ガード（429）未実装**：キャッシュで「減らす」まで。上限回数で「止める」（`GEOCODE_DAILY_QUOTA` の受け口は用意済み）は今後。
- **マーカーのクラスタリング未実装**（密集地帯向け。現状は距離順リスト＋件数で制御）。
- **可観測性未導入**：外部 API 呼び出し回数・キャッシュヒット率のメトリクス計測。負荷試験（k6 等）も未実施。

### セキュリティ・堅牢性
- **認証・認可なし（全公開）**。API のユーザー別レートリミット・濫用対策も未実装。
- グローバル例外フィルタ・**構造化ログ（相関 ID）** などの運用系は最小限。nginx のセキュリティヘッダ（CSP/HSTS 等）も未設定。

### 機能
- **カテゴリ絞り込み UI 未実装**（backend/API は `categories` 対応済みだがフロント未接続）。
- **地図中心・半径の URL 共有（deep link）未対応**、**マーカークリック時の詳細ポップアップ**も未実装。
