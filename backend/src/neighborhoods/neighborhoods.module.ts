import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeighborhoodsService } from './neighborhoods.service';
import { NeighborhoodsController } from './neighborhoods.controller';
import { Neighborhood } from './entities/neighborhoods.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Neighborhood])],
  controllers: [NeighborhoodsController],
  providers: [NeighborhoodsService],
  exports: [NeighborhoodsService],
})
export class NeighborhoodsModule {}