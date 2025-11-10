import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { Worker } from '../workers/entities/worker.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private requestsRepository: Repository<Request>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
  ) {}

  create(dto: CreateRequestDto, clientId: number) {
    const request = this.requestsRepository.create({
      ...dto,
      client_id: clientId, // Enforce client_id from JWT
      status: 'pending', // Force initial status
    });
    return this.requestsRepository.save(request);
  }

  findAll() {
    return this.requestsRepository.find({
      relations: ['client', 'client.neighborhood', 'worker', 'worker.user', 'worker.user.neighborhood', 'worker.profession'],
    });
  }

  async findOne(id: number) {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ['client', 'client.neighborhood', 'worker', 'worker.user', 'worker.user.neighborhood', 'worker.profession'],
    });
    if (!request) throw new NotFoundException(`Request ${id} not found`);
    return request;
  }

  findByClientId(clientId: number) {
    return this.requestsRepository.find({
      where: { client_id: clientId },
      relations: ['client', 'client.neighborhood', 'worker', 'worker.user', 'worker.user.neighborhood', 'worker.profession'],
    });
  }

  findByWorkerId(workerId: number) {
    return this.requestsRepository.find({
      where: { worker_id: workerId },
      relations: ['client', 'client.neighborhood', 'worker', 'worker.user', 'worker.user.neighborhood', 'worker.profession'],
    });
  }

  async update(id: number, dto: UpdateRequestDto, user: any) {
    const request = await this.findOne(id);
    
    // Ownership check: client can modify their requests, worker can modify requests assigned to them
    if (user.role === 'client' && request.client_id !== user.id) {
      throw new ForbiddenException('You can only modify your own requests');
    }
    if (user.role === 'worker') {
      const worker = await this.workersRepository.findOne({
        where: { user_id: user.id }
      });
      if (!worker || request.worker_id !== worker.id) {
        throw new ForbiddenException('You can only modify requests assigned to you');
      }
    }
    
    Object.assign(request, dto);
    
    return this.requestsRepository.save(request);
  }

  async updateStatus(id: number, dto: UpdateRequestStatusDto, user: any) {
    const request = await this.findOne(id);
    
    // Validate ownership and permissions
    await this.validateStatusUpdatePermissions(request, dto.status, user);
    
    // Validate status transition
    this.validateStatusTransition(request.status, dto.status);
    
    // Update request
    request.status = dto.status;
    if (dto.rejected_reason) {
      request.rejected_reason = dto.rejected_reason;
    }
    
    // Set completed_at when status changes to completed
    if (dto.status === 'completed') {
      request.completed_at = new Date();
    }
    
    return this.requestsRepository.save(request);
  }

  private async validateStatusUpdatePermissions(request: Request, newStatus: string, user: any) {
    console.log('Validating status update:', {
      requestId: request.id,
      newStatus,
      userId: user.id,
      userRole: user.role,
      requestWorkerId: request.worker_id,
      requestClientId: request.client_id,
    });

    // Client permissions
    if (user.role === 'client') {
      // Client can only modify their own requests
      if (request.client_id !== user.id) {
        throw new ForbiddenException('You can only modify your own requests');
      }
      // Client can only cancel their requests
      if (newStatus !== 'cancelled') {
        throw new ForbiddenException('Clients can only cancel their requests');
      }
    }
    
    // Worker permissions  
    if (user.role === 'worker') {
      // Find worker record for the authenticated user
      const worker = await this.workersRepository.findOne({
        where: { user_id: user.id }
      });
      
      console.log('Worker lookup result:', {
        userId: user.id,
        worker: worker ? { id: worker.id, user_id: worker.user_id } : null,
      });
      
      if (!worker) {
        throw new ForbiddenException('Worker profile not found');
      }
      
      // Worker can only modify requests assigned to them
      if (request.worker_id !== worker.id) {
        throw new ForbiddenException('You can only modify requests assigned to you');
      }
      // Worker can accept, reject, or complete requests
      if (!['accepted', 'rejected', 'completed'].includes(newStatus)) {
        throw new ForbiddenException('Workers can only accept, reject, or complete requests');
      }
    }
    
    // Admin can update any request to any status (no restrictions)
  }

  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const allowedTransitions: Record<string, string[]> = {
      'pending': ['accepted', 'rejected', 'cancelled'],
      'accepted': ['completed', 'cancelled'],
      'rejected': [], // No transitions from rejected
      'completed': [], // No transitions from completed
      'cancelled': [], // No transitions from cancelled
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: [${allowed.join(', ')}]`
      );
    }
  }

  async remove(id: number) {
    const request = await this.findOne(id);
    return this.requestsRepository.remove(request);
  }
}