import { Controller, Get } from '@nestjs/common';
import { SpotListResponseDto } from './dto/spot-response.dto';
import { SpotsService } from './spots.service';

@Controller('spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Get()
  findAll(): Promise<SpotListResponseDto> {
    return this.spotsService.findAll();
  }
}
