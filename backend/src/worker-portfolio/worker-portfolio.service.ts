import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerPortfolio } from './entities/worker-portfolio.entity';
import { CreateWorkerPortfolioDto } from './dto/create-worker-portfolio.dto';
import { UpdateWorkerPortfolioDto } from './dto/update-worker-portfolio.dto';
import { Worker } from '../workers/entities/worker.entity';

@Injectable()
export class WorkerPortfolioService {
  constructor(
    @InjectRepository(WorkerPortfolio)
    private workerPortfolioRepository: Repository<WorkerPortfolio>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
  ) {}

  async create(dto: CreateWorkerPortfolioDto, user: any) {
    // For workers, ensure they can only add to their own portfolio
    if (user.role === 'worker') {
      const worker = await this.workersRepository.findOne({
        where: { user_id: user.id },
      });
      
      if (!worker) {
        throw new NotFoundException('Worker profile not found. Please complete your worker registration first.');
      }
      
      // Override the worker_id in DTO to ensure it matches the authenticated worker
      dto.worker_id = worker.id;
    } else if (user.role === 'admin') {
      // Admins can create portfolios for any worker, but validate worker exists
      const worker = await this.workersRepository.findOne({
        where: { id: dto.worker_id },
      });
      
      if (!worker) {
        throw new NotFoundException(`Worker with ID ${dto.worker_id} not found`);
      }
    }
    
    const portfolio = this.workerPortfolioRepository.create(dto);
    return this.workerPortfolioRepository.save(portfolio);
  }

  findAll() {
    return this.workerPortfolioRepository.find({
      relations: ['worker'],
    });
  }

  async findOne(id: number) {
    const portfolio = await this.workerPortfolioRepository.findOne({
      where: { id },
      relations: ['worker'],
    });
    if (!portfolio) throw new NotFoundException(`Portfolio ${id} not found`);
    return portfolio;
  }

  findByWorkerId(workerId: number) {
    return this.workerPortfolioRepository.find({
      where: { worker_id: workerId },
      relations: ['worker'],
    });
  }

  async update(id: number, dto: UpdateWorkerPortfolioDto, user: any) {
    const portfolio = await this.findOne(id);
    
    // For workers, ensure they can only update their own portfolio items
    if (user.role === 'worker') {
      const worker = await this.workersRepository.findOne({
        where: { user_id: user.id },
      });
      
      if (!worker || portfolio.worker_id !== worker.id) {
        throw new ForbiddenException('You can only update your own portfolio items');
      }
    }
    
    Object.assign(portfolio, dto);
    return this.workerPortfolioRepository.save(portfolio);
  }

  async remove(id: number, user: any) {
    const portfolio = await this.findOne(id);
    
    // For workers, ensure they can only delete their own portfolio items
    if (user.role === 'worker') {
      const worker = await this.workersRepository.findOne({
        where: { user_id: user.id },
      });
      
      if (!worker || portfolio.worker_id !== worker.id) {
        throw new ForbiddenException('You can only delete your own portfolio items');
      }
    }
    
    return this.workerPortfolioRepository.remove(portfolio);
  }
}