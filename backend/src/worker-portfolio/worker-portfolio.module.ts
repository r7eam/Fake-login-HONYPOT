import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerPortfolioService } from './worker-portfolio.service';
import { WorkerPortfolioController } from './worker-portfolio.controller';
import { WorkerPortfolio } from './entities/worker-portfolio.entity';
import { Worker } from '../workers/entities/worker.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkerPortfolio, Worker])],
  controllers: [WorkerPortfolioController],
  providers: [WorkerPortfolioService],
  exports: [WorkerPortfolioService],
})
export class WorkerPortfolioModule {}