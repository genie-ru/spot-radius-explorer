import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spot } from './spot.entity';
import { SpotsController } from './spots.controller';
import { SpotsRepository } from './spots.repository';
import { SpotsService } from './spots.service';

@Module({
  imports: [TypeOrmModule.forFeature([Spot])],
  controllers: [SpotsController],
  providers: [SpotsService, SpotsRepository],
})
export class SpotsModule {}
