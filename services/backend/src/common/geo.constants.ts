// 位置情報のドメイン定数。緯度経度の妥当範囲（WGS84）・半径や件数の上限を、
// DTO のバリデーションやシードのチェックで共有し、マジックナンバーの重複を排除する。
export const LATITUDE_RANGE = { min: -90, max: 90 } as const;
export const LONGITUDE_RANGE = { min: -180, max: 180 } as const;

// 半径の上限(km)。日本列島の端〜端。frontend の MAX_RADIUS_KM と同じ値。
export const MAX_RADIUS_KM = 3000;

// 半径検索の返却件数の上限。
export const MAX_RESULT_LIMIT = 500;
