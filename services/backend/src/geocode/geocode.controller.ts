import { Controller, Get, Query } from '@nestjs/common';
import { ReverseGeocodeQueryDto } from './dto/reverse-geocode-query.dto';
import { GeocodeService } from './geocode.service';

// GET /api/geocode/reverse?lat=&lng= → { lat, lng, address, cached }
@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get('reverse')
  reverse(@Query() query: ReverseGeocodeQueryDto) {
    return this.geocodeService.reverse(query.lat, query.lng);
  }
}
