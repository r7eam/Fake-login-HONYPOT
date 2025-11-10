import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Request } from '../requests/entities/request.entity';
import { Worker } from '../workers/entities/worker.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Request)
    private requestsRepository: Repository<Request>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
  ) {}

  async create(dto: CreateReviewDto, clientId: number) {
    // Verify the request exists and is completed
    const request = await this.requestsRepository.findOne({
      where: { id: dto.request_id },
      relations: ['client', 'worker'],
    });
    
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    
    if (request.status !== 'completed') {
      throw new BadRequestException('Can only review completed requests');
    }
    
    if (request.client_id !== clientId) {
      throw new ForbiddenException('You can only review your own requests');
    }
    
    // Check if review already exists for this request
    const existingReview = await this.reviewsRepository.findOne({
      where: { request_id: dto.request_id },
    });
    
    if (existingReview) {
      throw new BadRequestException('Review already exists for this request');
    }
    
    const review = this.reviewsRepository.create({
      ...dto,
      client_id: clientId, // Enforce client_id from JWT
      worker_id: request.worker_id, // Ensure worker_id matches request
    });
    
    const savedReview = await this.reviewsRepository.save(review);
    
    // Recalculate worker's average rating
    await this.recalculateWorkerRating(request.worker_id);
    
    return savedReview;
  }

  findAll() {
    return this.reviewsRepository.find({
      relations: ['request', 'worker', 'client'],
    });
  }

  async findOne(id: number) {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['request', 'worker', 'client'],
    });
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    return review;
  }

  findByWorkerId(workerId: number) {
    return this.reviewsRepository.find({
      where: { worker_id: workerId },
      relations: ['request', 'worker', 'client'],
    });
  }

  async update(id: number, dto: UpdateReviewDto, user: any) {
    const review = await this.findOne(id);
    
    // Only the client who created the review can update it (or admin)
    if (user.role === 'client' && review.client_id !== user.id) {
      throw new ForbiddenException('You can only update your own reviews');
    }
    
    const oldRating = review.rating;
    Object.assign(review, dto);
    const updatedReview = await this.reviewsRepository.save(review);
    
    // Recalculate worker's average rating if rating changed
    if (dto.rating !== undefined && dto.rating !== oldRating) {
      await this.recalculateWorkerRating(review.worker_id);
    }
    
    return updatedReview;
  }

  async remove(id: number, user: any) {
    const review = await this.findOne(id);
    
    // Only the client who created the review can delete it (or admin)
    if (user.role === 'client' && review.client_id !== user.id) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    
    const workerId = review.worker_id;
    const removedReview = await this.reviewsRepository.remove(review);
    
    // Recalculate worker's average rating after deletion
    await this.recalculateWorkerRating(workerId);
    
    return removedReview;
  }

  private async recalculateWorkerRating(workerId: number) {
    const reviews = await this.reviewsRepository.find({
      where: { worker_id: workerId },
    });
    
    let averageRating = 0;
    let totalJobs = reviews.length; // Each review represents a completed job
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = Math.round((totalRating / reviews.length) * 100) / 100; // Round to 2 decimal places
    }
    
    await this.workersRepository.update(workerId, {
      average_rating: averageRating,
      total_jobs: totalJobs, // Update total jobs count as well
    });
  }
}