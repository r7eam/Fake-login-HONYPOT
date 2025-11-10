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
import { NeighborhoodsService } from './neighborhoods.service';
import { CreateNeighborhoodDto } from './dto/create-neighborhoods.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhoods.dto';
import { Roles } from '../auth/decorators/roles.decorators';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('neighborhoods')
@Controller('neighborhoods')
@ApiBearerAuth('JWT-auth')
export class NeighborhoodsController {
  constructor(private readonly neighborhoodsService: NeighborhoodsService) {}

  @ApiOperation({ summary: 'Create a new neighborhood' })
  @ApiResponse({ status: 201, description: 'Neighborhood created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 409, description: 'Neighborhood name already exists' })
  @ApiBody({
    description: 'Neighborhood data',
    type: CreateNeighborhoodDto,
    examples: {
      rightSide: {
        summary: 'Right Side Neighborhood',
        description: 'Create a neighborhood on the right side of Mosul',
        value: {
          name: 'الكرامة',
          area: 'الساحل الأيمن'
        }
      },
      leftSide: {
        summary: 'Left Side Neighborhood',
        description: 'Create a neighborhood on the left side of Mosul',
        value: {
          name: 'الوحدة',
          area: 'الساحل الأيسر'
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateNeighborhoodDto) {
    return this.neighborhoodsService.create(dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get()
  findAll() {
    return this.neighborhoodsService.findAll();
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.neighborhoodsService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update neighborhood' })
  @ApiResponse({ status: 200, description: 'Neighborhood updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Neighborhood not found' })
  @ApiBody({
    description: 'Neighborhood update data',
    type: UpdateNeighborhoodDto,
    examples: {
      updateName: {
        summary: 'Update Name',
        description: 'Update neighborhood name',
        value: {
          name: 'الكرامة الجديدة'
        }
      },
      changeArea: {
        summary: 'Change Area',
        description: 'Change neighborhood area',
        value: {
          area: 'الساحل الأيسر'
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNeighborhoodDto) {
    return this.neighborhoodsService.update(+id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.neighborhoodsService.remove(+id);
  }
}