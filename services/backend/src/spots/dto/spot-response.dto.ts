// GET /api/spots のレスポンス契約。DB の行ではなく API の公開形をここで固定し、
// エンティティ（geom など内部表現）とレスポンスを分離する。
export class SpotResponseDto {
  id!: number;
  name!: string;
  category!: string;
  address!: string;
  lat!: number;
  lng!: number;
  distanceM!: number; // 検索中心からの距離（メートル）
}

export class SpotListResponseDto {
  items!: SpotResponseDto[];
  count!: number;
}
