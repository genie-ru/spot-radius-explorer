import { Controller, Get, Query } from '@nestjs/common';
import { FindSpotsQueryDto } from './dto/find-spots-query.dto';
import { SpotListResponseDto } from './dto/spot-response.dto';
import { SpotsService } from './spots.service';

// GET /api/spots?lat=&lng=&radiusKm=&categories=&limit=
//   → 中心から radiusKm 以内のスポットを近い順に返す { items: [...], count }
@Controller('spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Get()
  search(@Query() query: FindSpotsQueryDto): Promise<SpotListResponseDto> {
    return this.spotsService.search(query);
  }
}
