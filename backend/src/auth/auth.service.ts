import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { WorkersService } from '../workers/workers.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private workersService: WorkersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByPhone(registerDto.phone);
    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const userData = {
      name: registerDto.name,
      email: registerDto.email,
      phone: registerDto.phone,
      password: hashedPassword,
      role: registerDto.role,
      neighborhood_id: registerDto.neighborhood_id,
      profile_image: registerDto.profile_image,
    };

    const user = await this.usersService.create(userData);

    // If user is a worker, create worker profile
    if (registerDto.role === 'worker') {
      if (!registerDto.profession_id) {
        throw new BadRequestException('Profession is required for worker registration');
      }

      const workerData = {
        user_id: user.id,
        profession_id: registerDto.profession_id,
        bio: registerDto.bio,
        experience_years: registerDto.experience_years || 0,
        contact_phone: registerDto.contact_phone,
        whatsapp_number: registerDto.whatsapp_number,
      };

      await this.workersService.create(workerData);
    }

    // Generate JWT token
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const access_token = this.jwtService.sign(payload);

    // Return user data without password
    const { password, ...userResult } = user;
    
    return {
      user: userResult,
      access_token,
      message: 'Registration successful',
    };
  }

  async login(loginDto: LoginDto) {
    let user;

    // Validate that either phone or email is provided
    if (!loginDto.phone && !loginDto.email) {
      throw new BadRequestException('Either phone or email must be provided');
    }

    // Find user by phone or email
    if (loginDto.phone) {
      user = await this.usersService.findByPhone(loginDto.phone);
      if (!user) {
        throw new UnauthorizedException('Invalid phone number or password');
      }
    } else if (loginDto.email) {
      user = await this.usersService.findByEmail(loginDto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate JWT token
    const payload = { sub: user.id, phone: user.phone, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    // Return user data without password
    const { password, ...userResult } = user;

    return {
      user: userResult,
      access_token,
      message: 'Login successful',
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    // Get user
    const user = await this.usersService.findOne(userId);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await this.usersService.update(userId, { password: hashedNewPassword });

    return {
      message: 'Password changed successfully',
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findOne(userId);
    const { password, ...userProfile } = user;

    // If user is a worker, get worker profile
    if (user.role === 'worker') {
      try {
        const workerProfile = await this.workersService.findByUserId(userId);
        return {
          ...userProfile,
          workerProfile,
        };
      } catch (error) {
        // Worker profile doesn't exist yet
        return userProfile;
      }
    }

    return userProfile;
  }
}