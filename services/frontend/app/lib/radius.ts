import { MAX_RADIUS_KM } from './config';

// 半径スライダーの段階（km）。最大は MAX_RADIUS_KM（日本列島を任意の中心から覆える上限）。
export const RADIUS_PRESETS_KM = [1, 3, 5, 10, 20, 50, 100, 300, 1000, MAX_RADIUS_KM];

// 現在値より一段大きい半径を返す（「半径を広げる」導線用）。
export function nextRadius(km: number): number {
  return RADIUS_PRESETS_KM.find((p) => p > km) ?? RADIUS_PRESETS_KM[RADIUS_PRESETS_KM.length - 1];
}

// 任意の km に最も近いプリセットのインデックス（スライダーのつまみ位置）。
export function nearestPresetIndex(km: number): number {
  let best = 0;
  let bestDiff = Infinity;
  RADIUS_PRESETS_KM.forEach((p, i) => {
    const diff = Math.abs(p - km);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  });
  return best;
}
