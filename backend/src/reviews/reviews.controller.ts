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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorators';

@ApiTags('reviews')
@Controller('reviews')
@ApiBearerAuth('JWT-auth')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'Create a review for completed request' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Can only review completed requests' })
  @ApiResponse({ status: 403, description: 'You can only review your own requests' })
  @ApiBody({
    description: 'Review data',
    type: CreateReviewDto,
    examples: {
      excellentWork: {
        summary: 'Excellent Work Review',
        description: 'High rating review for excellent service',
        value: {
          request_id: 1,
          rating: 5,
          comment: 'عمل ممتاز وسريع، الكهربائي محترف جداً وأنهى العمل في الوقت المحدد'
        }
      },
      goodWork: {
        summary: 'Good Work Review',
        description: 'Good rating review with constructive feedback',
        value: {
          request_id: 2,
          rating: 4,
          comment: 'عمل جيد ولكن تأخر قليلا عن الموعد المحدد'
        }
      },
      averageWork: {
        summary: 'Average Work Review',
        description: 'Average rating with feedback for improvement',
        value: {
          request_id: 3,
          rating: 3,
          comment: 'العمل مقبول ولكن يحتاج لتحسينات في الجودة'
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('client')
  @Post()
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: any) {
    return this.reviewsService.create(dto, user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get('worker/:workerId')
  findByWorkerId(@Param('workerId') workerId: string) {
    return this.reviewsService.findByWorkerId(+workerId);
  }

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 403, description: 'You can only update your own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiBody({
    description: 'Review update data',
    type: UpdateReviewDto,
    examples: {
      updateRating: {
        summary: 'Update Rating',
        description: 'Update review rating and comment',
        value: {
          rating: 4,
          comment: 'عمل جيد ولكن تأخر قليلا عن الموعد المحدد، نوعية العمل ممتازة'
        }
      },
      updateComment: {
        summary: 'Update Comment Only',
        description: 'Update only the review comment',
        value: {
          comment: 'تحديث: العامل عاد لإصلاح مشكلة صغيرة بدون أجر إضافي، خدمة ممتازة'
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('client', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReviewDto, @CurrentUser() user: any) {
    return this.reviewsService.update(+id, dto, user);
  }

  @ApiBearerAuth('JWT-auth')
  @Roles('client', 'admin')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reviewsService.remove(+id, user);
  }
}