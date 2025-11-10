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
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorators';

@ApiTags('requests')
@Controller('requests')
@ApiBearerAuth('JWT-auth')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiOperation({ summary: 'Create a new service request' })
  @ApiResponse({ status: 201, description: 'Request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Login required' })
  @ApiBody({
    description: 'Request data',
    type: CreateRequestDto,
    examples: {
      electricalWork: {
        summary: 'Electrical Work Request',
        description: 'Request for electrical repair work',
        value: {
          worker_id: 1,
          problem_description: 'مشكلة في الكهرباء بالمطبخ، الإنارة لا تعمل والمقابس لا تحتوي على تيار كهربائي'
        }
      },
      plumbingWork: {
        summary: 'Plumbing Work Request',
        description: 'Request for plumbing repair work',
        value: {
          worker_id: 2,
          problem_description: 'تسريب مياه في حنفية المطبخ وانسداد في مجرى المياه'
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Post()
  create(@Body() dto: CreateRequestDto, @CurrentUser() user: any) {
    return this.requestsService.create(dto, user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get()
  findAll() {
    return this.requestsService.findAll();
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get('client/:clientId')
  findByClientId(@Param('clientId') clientId: string) {
    return this.requestsService.findByClientId(+clientId);
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get('worker/:workerId')
  findByWorkerId(@Param('workerId') workerId: string) {
    return this.requestsService.findByWorkerId(+workerId);
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update request details' })
  @ApiResponse({ status: 200, description: 'Request updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only update own requests' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiBody({
    description: 'Request update data',
    type: UpdateRequestDto,
    examples: {
      updateDescription: {
        summary: 'Update Problem Description',
        description: 'Update the problem description',
        value: {
          problem_description: 'مشكلة في الكهرباء بالمطبخ والحمام، الإنارة لا تعمل والمقابس لا تحتوي على تيار كهربائي، يحتاج لفحص شامل'
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('client', 'worker')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRequestDto, @CurrentUser() user: any) {
    return this.requestsService.update(+id, dto, user);
  }

  @ApiOperation({ summary: 'Update request status' })
  @ApiResponse({ status: 200, description: 'Request status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiBody({
    description: 'Status update data',
    type: UpdateRequestStatusDto,
    examples: {
      accept: {
        summary: 'Accept Request',
        description: 'Worker accepts the request',
        value: {
          status: 'accepted'
        }
      },
      reject: {
        summary: 'Reject Request',
        description: 'Worker rejects the request with reason',
        value: {
          status: 'rejected',
          rejected_reason: 'غير متوفر في الوقت المحدد حاليا، يرجى المحاولة في وقت لاحق'
        }
      },
      complete: {
        summary: 'Complete Request',
        description: 'Worker marks request as completed',
        value: {
          status: 'completed'
        }
      },
      cancel: {
        summary: 'Cancel Request',
        description: 'Client cancels the request',
        value: {
          status: 'cancelled'
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('client', 'worker', 'admin')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRequestStatusDto, @CurrentUser() user: any) {
    return this.requestsService.updateStatus(+id, dto, user);
  }

  @ApiBearerAuth('JWT-auth')
  @Roles('client', 'admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requestsService.remove(+id);
  }
}