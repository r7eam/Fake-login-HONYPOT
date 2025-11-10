import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Neighborhood } from './entities/neighborhoods.entity';
import { CreateNeighborhoodDto } from './dto/create-neighborhoods.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhoods.dto';

@Injectable()
export class NeighborhoodsService {
  constructor(
    @InjectRepository(Neighborhood)
    private neighborhoodsRepository: Repository<Neighborhood>,
  ) {}

  async create(dto: CreateNeighborhoodDto) {
    try {
      const neighborhood = this.neighborhoodsRepository.create(dto);
      return await this.neighborhoodsRepository.save(neighborhood);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictException(`Neighborhood with name '${dto.name}' already exists`);
      }
      throw error;
    }
  }

  findAll() {
    return this.neighborhoodsRepository.find();
  }

  async findOne(id: number) {
    const neighborhood = await this.neighborhoodsRepository.findOneBy({ id });
    if (!neighborhood) throw new NotFoundException(`Neighborhood ${id} not found`);
    return neighborhood;
  }

  async update(id: number, dto: UpdateNeighborhoodDto) {
    const neighborhood = await this.findOne(id);
    Object.assign(neighborhood, dto);
    return this.neighborhoodsRepository.save(neighborhood);
  }

  async remove(id: number) {
    const neighborhood = await this.findOne(id);
    return this.neighborhoodsRepository.remove(neighborhood);
  }
}