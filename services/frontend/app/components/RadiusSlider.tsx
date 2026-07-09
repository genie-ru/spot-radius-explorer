import { nearestPresetIndex, RADIUS_PRESETS_KM } from '../lib/radius';

interface Props {
  radiusKm: number;
  onChange: (km: number) => void;
}

export function RadiusSlider({ radiusKm, onChange }: Props) {
  const index = nearestPresetIndex(radiusKm);
  const max = RADIUS_PRESETS_KM.length - 1;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">検索半径</span>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-blue-700">
          {radiusKm} km
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={index}
        onChange={(e) => onChange(RADIUS_PRESETS_KM[Number(e.target.value)])}
        className="mt-2 w-full accent-blue-600"
        aria-label="検索半径"
      />
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{RADIUS_PRESETS_KM[0]} km</span>
        <span>{RADIUS_PRESETS_KM[max]} km</span>
      </div>
    </div>
  );
}
