import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiConsumes, 
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { FindWorkersQueryDto } from './dto/find-workers-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorators';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Configure multer for worker profile images
const workerProfileImageStorage = {
  storage: diskStorage({
    destination: './uploads/worker-profiles',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `worker-profile-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return callback(new BadRequestException('Only image files are allowed!'), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
};

@ApiTags('workers')
@Controller('workers')
@ApiBearerAuth('JWT-auth')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @ApiOperation({ summary: 'Create a new worker profile' })
  @ApiResponse({ status: 201, description: 'Worker profile created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only workers and admins can create profiles' })
  @ApiBody({
    description: 'Worker profile data',
    type: CreateWorkerDto,
    examples: {
      electrician: {
        summary: 'Electrician Worker',
        description: 'Create a new electrician worker profile',
        value: {
          profession_id: 1,
          bio: 'كهربائي محترف مع خبرة 5 سنوات في صيانة وتركيب الأجهزة الكهربائية والإنارة المنزلية والتجارية',
          experience_years: 5,
          contact_phone: '07901234568',
          whatsapp_number: '07901234568',
          is_available: true
        }
      },
      plumber: {
        summary: 'Plumber Worker',
        description: 'Create a new plumber worker profile',
        value: {
          profession_id: 2,
          bio: 'سباك محترف متخصص في إصلاح وتركيب الأنابيب والحنفيات وأجهزة الصرف الصحي',
          experience_years: 3,
          contact_phone: '07901234569',
          whatsapp_number: '07901234569',
          facebook_url: 'https://facebook.com/plumber.mohammed',
          is_available: true
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('worker', 'admin')
  @Post()
  async create(@Body() dto: CreateWorkerDto, @CurrentUser() user: any) {
  
    if (user.role === 'worker') {
      dto.user_id = user.id;
    }

    return this.workersService.create(dto);
  }

  @ApiOperation({ summary: 'Get all workers with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of workers with pagination metadata' })
  @ApiQuery({ name: 'profession_id', required: false, description: 'Filter by profession ID' })
  @ApiQuery({ name: 'neighborhood_id', required: false, description: 'Filter by neighborhood ID' })
  @ApiQuery({ name: 'area', required: false, description: 'Filter by area name (Arabic)' })
  @ApiQuery({ name: 'is_available', required: false, description: 'Filter by availability status' })
  @ApiQuery({ name: 'min_rating', required: false, description: 'Minimum rating filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name and bio' })
  @ApiQuery({ name: 'sort', required: false, enum: ['rating', 'experience', 'jobs', 'name', 'recent'] })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get()
  findAll(@Query() query: FindWorkersQueryDto) {
    return this.workersService.findAll(query);
  }

  @ApiOperation({ summary: 'Get worker by ID' })
  @ApiResponse({ status: 200, description: 'Worker profile found' })
  @ApiResponse({ status: 404, description: 'Worker not found' })
  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workersService.findOne(+id);
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.workersService.findByUserId(+userId);
  }

  @ApiOperation({ summary: 'Update worker profile' })
  @ApiResponse({ status: 200, description: 'Worker profile updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only update own profile' })
  @ApiResponse({ status: 404, description: 'Worker not found' })
  @ApiBody({
    description: 'Worker profile update data',
    type: UpdateWorkerDto,
    examples: {
      updateContact: {
        summary: 'Update Contact Info',
        description: 'Update worker contact information',
        value: {
          contact_phone: '07901234569',
          whatsapp_number: '07901234569',
          facebook_url: 'https://facebook.com/mohammed.electrician'
        }
      },
      updateBio: {
        summary: 'Update Bio and Experience',
        description: 'Update worker bio and experience',
        value: {
          bio: 'كهربائي محترف مع خبرة 7 سنوات في صيانة وتركيب الأجهزة الكهربائية والإنارة المنزلية والتجارية',
          experience_years: 7
        }
      },
      updateAvailability: {
        summary: 'Update Availability',
        description: 'Update worker availability status',
        value: {
          is_available: false
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('worker', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkerDto) {
    return this.workersService.update(+id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workersService.remove(+id);
  }

  @ApiOperation({ summary: 'Upload worker profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Worker profile image',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file uploaded or invalid file type' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only upload own profile image' })
  @ApiBearerAuth('JWT-auth')
  @Roles('worker', 'admin')
  @Post(':id/upload-profile-image')
  @UseInterceptors(FileInterceptor('image', workerProfileImageStorage))
  async uploadProfileImage(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // For workers, ensure they can only upload to their own profile
    if (user.role === 'worker') {
      const worker = await this.workersService.findByUserId(user.id);
      if (worker.id !== +id) {
        throw new BadRequestException('You can only upload your own profile image');
      }
    }

    const imageUrl = `/uploads/worker-profiles/${file.filename}`;
    
    // Update worker's profile_image in database
    await this.workersService.update(+id, { profile_image: imageUrl });

    return {
      message: 'Worker profile image uploaded successfully',
      profile_image: imageUrl,
    };
  }

  @ApiOperation({ summary: 'Upload current user profile image (convenience endpoint)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Worker profile image',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file uploaded or invalid file type' })
  @ApiResponse({ status: 404, description: 'Worker profile not found' })
  @ApiBearerAuth('JWT-auth')
  @Roles('worker')
  @Post('upload-my-profile-image')
  @UseInterceptors(FileInterceptor('image', workerProfileImageStorage))
  async uploadMyProfileImage(
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Get worker profile by user ID
    const worker = await this.workersService.findByUserId(user.id);
    if (!worker) {
      throw new BadRequestException('Worker profile not found');
    }

    const imageUrl = `/uploads/worker-profiles/${file.filename}`;
    
    // Update worker's profile_image in database
    await this.workersService.update(worker.id, { profile_image: imageUrl });

    return {
      message: 'Worker profile image uploaded successfully',
      profile_image: imageUrl,
      worker_id: worker.id,
    };
  }
}