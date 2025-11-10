import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { WorkerPortfolioService } from './worker-portfolio.service';
import { CreateWorkerPortfolioDto } from './dto/create-worker-portfolio.dto';
import { UpdateWorkerPortfolioDto } from './dto/update-worker-portfolio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
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

// Configure multer for portfolio images
const portfolioImageStorage = {
  storage: diskStorage({
    destination: './uploads/portfolio',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `portfolio-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return callback(new BadRequestException('Only image files are allowed!'), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for portfolio images
  },
};

@ApiTags('worker-portfolio')
@Controller('worker-portfolio')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkerPortfolioController {
  constructor(private readonly workerPortfolioService: WorkerPortfolioService) {}

  @ApiOperation({ summary: 'Create a new portfolio item' })
  @ApiResponse({ status: 201, description: 'Portfolio item created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Worker can only create their own portfolio' })
  @ApiResponse({ status: 404, description: 'Worker profile not found' })
  @ApiBody({
    description: 'Portfolio item data',
    type: CreateWorkerPortfolioDto,
    examples: {
      electricalWork: {
        summary: 'Electrical Work Portfolio',
        description: 'Add electrical work to portfolio',
        value: {
          image_url: '/uploads/portfolio/electrical-work-123.jpg',
          description: 'مشروع تركيب إنارة LED حديثة في منزل سكني، شمل العمل تركيب جميع وحدات الإنارة وتمديد الأسلاك'
        }
      },
      plumbingWork: {
        summary: 'Plumbing Work Portfolio',
        description: 'Add plumbing work to portfolio',
        value: {
          image_url: '/uploads/portfolio/plumbing-work-456.jpg',
          description: 'إصلاح شامل لنظام الصرف الصحي في المطبخ والحمام مع تركيب حنفيات جديدة'
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('worker', 'admin')
  @Post()
  create(@Body() dto: CreateWorkerPortfolioDto, @CurrentUser() user: any) {
    return this.workerPortfolioService.create(dto, user);
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get()
  findAll() {
    return this.workerPortfolioService.findAll();
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get('worker/:workerId')
  findByWorkerId(@Param('workerId') workerId: string) {
    return this.workerPortfolioService.findByWorkerId(+workerId);
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workerPortfolioService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update portfolio item' })
  @ApiResponse({ status: 200, description: 'Portfolio item updated successfully' })
  @ApiResponse({ status: 403, description: 'You can only update your own portfolio items' })
  @ApiResponse({ status: 404, description: 'Portfolio item not found' })
  @ApiBody({
    description: 'Portfolio item update data',
    type: UpdateWorkerPortfolioDto,
    examples: {
      updateDescription: {
        summary: 'Update Description',
        description: 'Update portfolio item description',
        value: {
          description: 'مشروع تركيب إنارة LED حديثة في منزل سكني (محدث)، شمل العمل تركيب جميع وحدات الإنارة وتمديد الأسلاك مع ضمان سنة كاملة'
        }
      },
      updateImage: {
        summary: 'Update Image URL',
        description: 'Update portfolio item image',
        value: {
          image_url: '/uploads/portfolio/updated-portfolio-789.jpg',
          description: 'صورة محدثة للمشروع بعد الانتهاء'
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('worker', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkerPortfolioDto, @CurrentUser() user: any) {
    return this.workerPortfolioService.update(+id, dto, user);
  }

  @ApiBearerAuth('JWT-auth')
  @Roles('worker', 'admin')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workerPortfolioService.remove(+id, user);
  }

  @ApiOperation({ summary: 'Create portfolio item with image upload' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Portfolio item created with image successfully' })
  @ApiResponse({ status: 400, description: 'No image file uploaded or invalid file type' })
  @ApiResponse({ status: 403, description: 'Forbidden - Worker can only create their own portfolio' })
  @ApiBody({
    description: 'Portfolio item with image upload',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Portfolio image file'
        },
        description: {
          type: 'string',
          description: 'Description of the work',
          example: 'مشروع تركيب إنارة LED حديثة في منزل سكني'
        },
        worker_id: {
          type: 'integer',
          description: 'Worker ID (optional for workers)',
          example: 1
        }
      },
      required: ['image']
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('worker', 'admin')
  @Post('upload-with-image')
  @UseInterceptors(FileInterceptor('image', portfolioImageStorage))
  async createWithImage(
    @UploadedFile() file: MulterFile,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }

    const imageUrl = `/uploads/portfolio/${file.filename}`;
    
    const portfolioDto: CreateWorkerPortfolioDto = {
      image_url: imageUrl,
      description: body.description || null,
      worker_id: body.worker_id ? Number(body.worker_id) : undefined,
    };

    const portfolio = await this.workerPortfolioService.create(portfolioDto, user);

    return {
      ...portfolio,
      message: 'Portfolio item created with image successfully',
    };
  }

  @ApiOperation({ summary: 'Upload multiple portfolio images at once' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('JWT-auth')
  @Roles('worker', 'admin')
  @Post('upload-multiple-images')
  @UseInterceptors(FilesInterceptor('images', 10, portfolioImageStorage))
  async createWithMultipleImages(
    @UploadedFiles() files: MulterFile[],
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No image files uploaded');
    }

    const portfolioItems: any[] = [];

    for (const file of files) {
      const imageUrl = `/uploads/portfolio/${file.filename}`;
      
      const portfolioDto: CreateWorkerPortfolioDto = {
        image_url: imageUrl,
        description: body.description || null,
        worker_id: body.worker_id ? Number(body.worker_id) : undefined,
      };

      const portfolio = await this.workerPortfolioService.create(portfolioDto, user);
      portfolioItems.push(portfolio);
    }

    return {
      portfolioItems,
      count: portfolioItems.length,
      message: `${portfolioItems.length} portfolio items created successfully`,
    };
  }
}