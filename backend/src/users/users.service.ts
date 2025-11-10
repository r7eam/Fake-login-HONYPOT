import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(dto: CreateUserDto) {
    const user = this.usersRepository.create(dto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async updateLastLogin(id: number) {
    await this.usersRepository.update(id, { last_login: new Date() });
  }

  async findByPhone(phone: string) {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async remove(id: number) {
    const user = await this.usersRepository.findOne({ 
      where: { id },
      relations: ['neighborhood']
    });
    
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    
    await this.usersRepository.delete(id);
    return { message: 'User deleted successfully', id };
  }
}
