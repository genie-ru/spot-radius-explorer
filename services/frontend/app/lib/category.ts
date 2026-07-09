// カテゴリ名から安定した色相を導出し、一覧のドット/チップに使う（凡例的な視認性）。
export function categoryHue(category: string): number {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) % 360;
  }
  return hash;
}

export function categoryColor(category: string): string {
  return `hsl(${categoryHue(category)} 62% 45%)`;
}

// 同じ色相の淡い背景（チップ用）。
export function categoryTint(category: string): string {
  return `hsl(${categoryHue(category)} 62% 45% / 0.1)`;
}
