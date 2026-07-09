import { Module } from '@nestjs/common';
import { SpotsSeeder } from './spots.seeder';

// 各テーブルのシーダーを束ねるモジュール。
// テーブルを増やしたら、対応するシーダーを作ってここの providers に追加する。
// 各シーダーは自分のテーブルの空チェック（冪等性）を自分で持つ。
//
// ─ 将来の判断ポイント（SeedRunner 導入トリガー）─────────────────────
// 現状は各シーダーが個別に OnApplicationBootstrap で走る（実行順は登録順まかせの暗黙依存）。
// 次の「両方」が揃ったら、暗黙順序をやめて順番に呼ぶオーケストレータ(SeedRunner)を1つ置く:
//   1. 2つ目以降のシーダーができる、かつ
//   2. その間に順序依存がある（例: reviews.spot_id → spots.id を参照するので spots を先に投入）
// ────────────────────────────────────────────────────────────────
@Module({
  providers: [SpotsSeeder],
})
export class SeedModule {}
