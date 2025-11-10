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
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorators';

@ApiTags('favorites')
@Controller('favorites')
@ApiBearerAuth('JWT-auth')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @ApiOperation({ summary: 'Add worker to favorites' })
  @ApiResponse({ status: 201, description: 'Worker added to favorites successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Client only' })
  @ApiBody({
    description: 'Favorite data',
    type: CreateFavoriteDto,
    examples: {
      addFavorite: {
        summary: 'Add Worker to Favorites',
        description: 'Add a worker to client favorites list',
        value: {
          worker_id: 1
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('client')
  @Post()
  create(@Body() dto: CreateFavoriteDto, @CurrentUser() user: any) {
    return this.favoritesService.create(dto, user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Get()
  findAll() {
    return this.favoritesService.findAll();
  }

  @ApiBearerAuth('JWT-auth')
  @Roles('client')
  @Get('client/:clientId')
  findByClientId(@Param('clientId') clientId: string, @CurrentUser() user: any) {
    return this.favoritesService.findByClientId(+clientId, user);
  }

  @ApiBearerAuth('JWT-auth')
  @Roles('client')
  @Get('client/:clientId/worker/:workerId')
  findByClientAndWorker(
    @Param('clientId') clientId: string,
    @Param('workerId') workerId: string,
  ) {
    return this.favoritesService.findByClientAndWorker(+clientId, +workerId);
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.favoritesService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update favorite' })
  @ApiResponse({ status: 200, description: 'Favorite updated successfully' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  @ApiBody({
    description: 'Favorite update data',
    type: UpdateFavoriteDto,
    examples: {
      updateWorker: {
        summary: 'Update Worker',
        description: 'Update the worker in favorite',
        value: {
          worker_id: 2
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFavoriteDto) {
    return this.favoritesService.update(+id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.favoritesService.remove(+id);
  }

  @ApiBearerAuth('JWT-auth')
  @Roles('client')
  @Delete('client/:clientId/worker/:workerId')
  removeByClientAndWorker(
    @Param('clientId') clientId: string,
    @Param('workerId') workerId: string,
    @CurrentUser() user: any,
  ) {
    return this.favoritesService.removeByClientAndWorker(+clientId, +workerId, user);
  }
}