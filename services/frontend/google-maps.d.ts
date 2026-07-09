// Google Maps JS API のグローバル型（@types/google.maps）を明示的に読み込む。
// 間接依存のままだと一部の IDE/TS サーバーが `google` 名前空間を解決できないことがあるため、
// プロジェクト全体で確実にグローバル宣言を有効化する。
/// <reference types="google.maps" />
