import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Worker } from './entities/worker.entity';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { FindWorkersQueryDto } from './dto/find-workers-query.dto';
import { createPaginatedResponse, PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
  ) {}

  create(dto: CreateWorkerDto) {
    const worker = this.workersRepository.create(dto);
    return this.workersRepository.save(worker);
  }

  async findAll(query: FindWorkersQueryDto = {}): Promise<PaginatedResponseDto<Worker>> {
    const {
      profession_id,
      neighborhood_id,
      area,
      is_available,
      min_rating,
      search,
      sort = 'recent',
      order = 'DESC',
      page = 1,
      limit = 20,
    } = query;

    const queryBuilder: SelectQueryBuilder<Worker> = this.workersRepository
      .createQueryBuilder('worker')
      .leftJoinAndSelect('worker.user', 'user')
      .leftJoinAndSelect('worker.profession', 'profession')
      .leftJoinAndSelect('user.neighborhood', 'neighborhood');

    // Apply filters
    if (profession_id) {
      queryBuilder.andWhere('worker.profession_id = :profession_id', { profession_id });
    }

    if (neighborhood_id) {
      queryBuilder.andWhere('user.neighborhood_id = :neighborhood_id', { neighborhood_id });
    }

    if (area) {
      queryBuilder.andWhere('neighborhood.area = :area', { area });
    }

    if (typeof is_available === 'boolean') {
      queryBuilder.andWhere('worker.is_available = :is_available', { is_available });
    }

    if (min_rating) {
      queryBuilder.andWhere('worker.average_rating >= :min_rating', { min_rating });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR worker.bio ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    switch (sort) {
      case 'rating':
        queryBuilder.orderBy('worker.average_rating', order);
        break;
      case 'experience':
        queryBuilder.orderBy('worker.experience_years', order);
        break;
      case 'jobs':
        queryBuilder.orderBy('worker.total_jobs', order);
        break;
      case 'name':
        queryBuilder.orderBy('user.name', order);
        break;
      case 'recent':
      default:
        queryBuilder.orderBy('worker.created_at', order);
        break;
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    return this.getPaginatedResult(queryBuilder, page, limit);
  }

  private async getPaginatedResult(
    queryBuilder: SelectQueryBuilder<Worker>,
    page: number,
    limit: number,
  ): Promise<PaginatedResponseDto<Worker>> {
    const [workers, total] = await queryBuilder.getManyAndCount();
    return createPaginatedResponse(workers, total, page, limit);
  }

  async findOne(id: number) {
    const worker = await this.workersRepository.findOne({
      where: { id },
      relations: ['user', 'profession', 'user.neighborhood'],
    });
    if (!worker) throw new NotFoundException(`Worker ${id} not found`);
    return worker;
  }

  async findByUserId(userId: number) {
    const worker = await this.workersRepository.findOne({
      where: { user_id: userId },
      relations: ['user', 'profession', 'user.neighborhood'],
    });
    if (!worker) throw new NotFoundException(`Worker with user_id ${userId} not found`);
    return worker;
  }

  async update(id: number, dto: UpdateWorkerDto) {
    const worker = await this.findOne(id);
    Object.assign(worker, dto);
    return this.workersRepository.save(worker);
  }

  async remove(id: number) {
    const worker = await this.findOne(id);
    return this.workersRepository.remove(worker);
  }
}