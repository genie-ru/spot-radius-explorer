import { Injectable } from '@nestjs/common';
import { SpotListResponseDto, SpotResponseDto } from './dto/spot-response.dto';
import { SpotsRepository } from './spots.repository';

@Injectable()
export class SpotsService {
  constructor(private readonly spotsRepository: SpotsRepository) {}

  // 全スポットを取得し、レスポンス DTO へマッピングして返す。
  async findAll(): Promise<SpotListResponseDto> {
    const rows = await this.spotsRepository.findAllProjected();
    const items: SpotResponseDto[] = rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      category: r.category,
      address: r.address,
      lat: Number(r.lat),
      lng: Number(r.lng),
    }));
    return { items, count: items.length };
  }
}
