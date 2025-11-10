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
import { ProfessionsService } from './professions.service';
import { CreateProfessionDto } from './dto/create-professions.dto';
import { UpdateProfessionDto } from './dto/update-professions.dto';
import { Roles } from '../auth/decorators/roles.decorators';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('professions')
@Controller('professions')
@ApiBearerAuth('JWT-auth')
export class ProfessionsController {
  constructor(private readonly professionsService: ProfessionsService) {}

  @ApiOperation({ summary: 'Create a new profession' })
  @ApiResponse({ status: 201, description: 'Profession created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 409, description: 'Profession name already exists' })
  @ApiBody({
    description: 'Profession data',
    type: CreateProfessionDto,
    examples: {
      electrician: {
        summary: 'Electrician Profession',
        description: 'Create electrician profession',
        value: {
          name: 'كهربائي',
          description: 'إصلاح وصيانة الأجهزة الكهربائية والإنارة المنزلية والتجارية',
          is_active: true
        }
      },
      plumber: {
        summary: 'Plumber Profession',
        description: 'Create plumber profession',
        value: {
          name: 'سباك',
          description: 'إصلاح وتركيب الأنابيب والحنفيات وأجهزة الصرف الصحي',
          is_active: true
        }
      },
      carpenter: {
        summary: 'Carpenter Profession',
        description: 'Create carpenter profession',
        value: {
          name: 'نجار',
          description: 'تصنيع وإصلاح الأثاث الخشبي والأبواب والنوافذ',
          is_active: true
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateProfessionDto) {
    return this.professionsService.create(dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get()
  findAll() {
    return this.professionsService.findAll();
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get('active')
  findActive() {
    return this.professionsService.findActive();
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.professionsService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update profession' })
  @ApiResponse({ status: 200, description: 'Profession updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Profession not found' })
  @ApiBody({
    description: 'Profession update data',
    type: UpdateProfessionDto,
    examples: {
      updateDescription: {
        summary: 'Update Description',
        description: 'Update profession description',
        value: {
          description: 'إصلاح وصيانة الأجهزة الكهربائية والإنارة المنزلية والتجارية مع خدمات الطوارئ على مدار الساعة'
        }
      },
      deactivate: {
        summary: 'Deactivate Profession',
        description: 'Deactivate profession',
        value: {
          is_active: false
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProfessionDto) {
    return this.professionsService.update(+id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.professionsService.remove(+id);
  }
}