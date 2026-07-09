import { useEffect, useState } from 'react';

// value が変わってから delayMs 静止したら反映する。連続変化（地図移動・スライダー）を間引く。
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
