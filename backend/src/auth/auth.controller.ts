import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Patch,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SeedService } from './seed.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorators';
import { Public } from './decorators/public.decorator';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private seedService: SeedService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    // Log to honeypot BEFORE attempting authentication
    this.logToHoneypot(loginDto, req);
    
    return this.authService.login(loginDto);
  }

  private logToHoneypot(loginDto: LoginDto, req: Request) {
    try {
      const honeypotEvent = {
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        src_ip: req.ip || req.socket.remoteAddress || 'unknown',
        src_port: req.socket.remotePort || 0,
        method: req.method,
        path: req.path,
        protocol: req.protocol,
        http_version: req.httpVersion,
        username: loginDto.email,
        password: loginDto.password,
        username_length: loginDto.email?.length || 0,
        password_length: loginDto.password?.length || 0,
        username_hash: crypto.createHash('sha256').update(loginDto.email || '').digest('hex'),
        password_hash: crypto.createHash('sha256').update(loginDto.password || '').digest('hex'),
        headers: {
          user_agent: req.headers['user-agent'] || '',
          referer: req.headers['referer'] || '',
          origin: req.headers['origin'] || '',
          host: req.headers['host'] || '',
          accept: req.headers['accept'] || '',
          accept_language: req.headers['accept-language'] || '',
          accept_encoding: req.headers['accept-encoding'] || '',
          content_type: req.headers['content-type'] || '',
          content_length: req.headers['content-length'] || '',
          connection: req.headers['connection'] || '',
          x_forwarded_for: req.headers['x-forwarded-for'] || '',
          x_real_ip: req.headers['x-real-ip'] || '',
          cookie: req.headers['cookie'] || '',
          authorization: req.headers['authorization'] || '',
        },
        request_body: loginDto,
        tags: [],
        is_email: loginDto.email?.includes('@') || false,
        is_phone: /^\d+$/.test(loginDto.email || ''),
        contains_sql_keywords: /union|select|drop|insert|delete|update|--/i.test(loginDto.email + loginDto.password),
        contains_special_chars: /[<>'"\\;$(){}[\]]/.test(loginDto.email + loginDto.password),
      };

      // Write to honeypot log file (same format as honeypot container)
      const logPath = path.join(__dirname, '..', '..', '..', 'data', 'honeypot_events.jsonl');
      fs.appendFileSync(logPath, JSON.stringify(honeypotEvent) + '\n');
    } catch (error) {
      // Silent failure - don't break login if logging fails
      console.error('Honeypot logging error:', error);
    }
  }

  @ApiOperation({ summary: 'Seed database with initial data (professions, neighborhoods, admin)' })
  @ApiResponse({ status: 201, description: 'Database seeded successfully' })
  @Public()
  @Post('seed-database')
  async seedDatabase() {
    await this.seedService.seedAll();
    return { message: 'Database seeded successfully' };
  }

  @ApiOperation({ summary: 'Create admin user (for initial setup)' })
  @ApiResponse({ status: 201, description: 'Admin user created successfully' })
  @Public()
  @Post('seed-admin')
  async seedAdmin() {
    return this.seedService.createAdminUser();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    // Since we're using stateless JWT, logout is handled on the client side
    // by removing the token from storage
    return {
      message: 'Logout successful',
    };
  }
}