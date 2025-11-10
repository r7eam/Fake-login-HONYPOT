import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
  ) {}

  async create(dto: CreateFavoriteDto, clientId: number) {
    // Check if favorite already exists
    const existingFavorite = await this.findByClientAndWorker(clientId, dto.worker_id);
    
    if (existingFavorite) {
      // Return existing favorite for idempotent behavior
      return existingFavorite;
    }
    
    // Create new favorite
    const favorite = this.favoritesRepository.create({
      ...dto,
      client_id: clientId, // Enforce client_id from JWT
    });
    
    try {
      return await this.favoritesRepository.save(favorite);
    } catch (error) {
      // Handle unique constraint violation gracefully
      if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
        // Race condition: favorite was created by another request
        const existingFavorite = await this.findByClientAndWorker(clientId, dto.worker_id);
        if (existingFavorite) {
          return existingFavorite;
        }
      }
      throw error; // Re-throw if not a duplicate error
    }
  }

  findAll() {
    return this.favoritesRepository.find({
      relations: ['client', 'worker'],
    });
  }

  async findOne(id: number) {
    const favorite = await this.favoritesRepository.findOne({
      where: { id },
      relations: ['client', 'worker'],
    });
    if (!favorite) throw new NotFoundException(`Favorite ${id} not found`);
    return favorite;
  }

  findByClientId(clientId: number, user: any) {
    // Ensure user can only see their own favorites
    if (user.role === 'client' && user.id !== clientId) {
      throw new ForbiddenException('You can only view your own favorites');
    }
    
    return this.favoritesRepository.find({
      where: { client_id: clientId },
      relations: ['client', 'worker'],
    });
  }

  async findByClientAndWorker(clientId: number, workerId: number) {
    const favorite = await this.favoritesRepository.findOne({
      where: { client_id: clientId, worker_id: workerId },
      relations: ['client', 'worker'],
    });
    
    // Explicitly return null if not found (instead of undefined)
    return favorite || null;
  }

  async update(id: number, dto: UpdateFavoriteDto) {
    const favorite = await this.findOne(id);
    Object.assign(favorite, dto);
    return this.favoritesRepository.save(favorite);
  }

  async remove(id: number) {
    const favorite = await this.findOne(id);
    return this.favoritesRepository.remove(favorite);
  }

  async removeByClientAndWorker(clientId: number, workerId: number, user: any) {
    // Ensure user can only remove their own favorites
    if (user.role === 'client' && user.id !== clientId) {
      throw new ForbiddenException('You can only remove your own favorites');
    }
    
    const favorite = await this.findByClientAndWorker(clientId, workerId);
    if (!favorite) throw new NotFoundException(`Favorite not found`);
    return this.favoritesRepository.remove(favorite);
  }
}