import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorators';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiBody({
    description: 'User data',
    type: CreateUserDto,
    examples: {
      client: {
        summary: 'Client User',
        description: 'Create a new client user',
        value: {
          name: 'أحمد علي محمد',
          email: 'ahmed@example.com',
          phone: '07901234567',
          password: 'password123',
          role: 'client',
          neighborhood_id: 1
        }
      },
      worker: {
        summary: 'Worker User',
        description: 'Create a new worker user',
        value: {
          name: 'محمد حسن علي',
          email: 'mohammed@example.com',
          phone: '07901234568',
          password: 'password123',
          role: 'worker',
          neighborhood_id: 1
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({
    description: 'User update data',
    type: UpdateUserDto,
    examples: {
      updateProfile: {
        summary: 'Update Profile',
        description: 'Update user profile information',
        value: {
          name: 'أحمد علي محمد (محدث)',
          email: 'ahmed.updated@example.com',
          neighborhood_id: 2
        }
      },
      updateStatus: {
        summary: 'Update Status',
        description: 'Update user verification and active status',
        value: {
          email_verified: true,
          phone_verified: true,
          is_active: true
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(+id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
