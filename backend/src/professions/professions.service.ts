import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profession } from './entities/professions.entity';
import { CreateProfessionDto } from './dto/create-professions.dto';
import { UpdateProfessionDto } from './dto/update-professions.dto';

@Injectable()
export class ProfessionsService {
  constructor(
    @InjectRepository(Profession)
    private professionsRepository: Repository<Profession>,
  ) {}

  async create(dto: CreateProfessionDto) {
    try {
      const profession = this.professionsRepository.create(dto);
      return await this.professionsRepository.save(profession);
    } catch (error) {
      // Postgres unique violation
      if (error && (error.code === '23505' || error?.driverError?.code === '23505')) {
        throw new ConflictException(`Profession with name '${dto.name}' already exists`);
      }
      throw error;
    }
  }

  findAll() {
    return this.professionsRepository.find();
  }

  findActive() {
    return this.professionsRepository.find({
      where: { is_active: true }
    });
  }

  async findOne(id: number) {
    const profession = await this.professionsRepository.findOneBy({ id });
    if (!profession) throw new NotFoundException(`Profession ${id} not found`);
    return profession;
  }

  async update(id: number, dto: UpdateProfessionDto) {
    const profession = await this.findOne(id);
    Object.assign(profession, dto);
    return this.professionsRepository.save(profession);
  }

  async remove(id: number) {
    const profession = await this.findOne(id);
    return this.professionsRepository.remove(profession);
  }
}