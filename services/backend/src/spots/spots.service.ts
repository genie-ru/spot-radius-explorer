import { Injectable } from '@nestjs/common';
import { FindSpotsQueryDto } from './dto/find-spots-query.dto';
import { SpotListResponseDto, SpotResponseDto } from './dto/spot-response.dto';
import { SpotsRepository } from './spots.repository';

@Injectable()
export class SpotsService {
  constructor(private readonly spotsRepository: SpotsRepository) {}

  // 中心・半径・カテゴリで絞り込んだスポットを、近い順にレスポンス DTO へマッピングして返す。
  async search(query: FindSpotsQueryDto): Promise<SpotListResponseDto> {
    const rows = await this.spotsRepository.findWithinRadius(query);
    const items: SpotResponseDto[] = rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      category: r.category,
      address: r.address,
      lat: Number(r.lat),
      lng: Number(r.lng),
      distanceM: Math.round(Number(r.distance_m)),
    }));
    return { items, count: items.length };
  }
}
