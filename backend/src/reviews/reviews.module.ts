import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from './entities/review.entity';
import { Request } from '../requests/entities/request.entity';
import { Worker } from '../workers/entities/worker.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Request, Worker])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}