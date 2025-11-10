import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkerPortfolioDto {
  @ApiProperty({
    description: 'Worker ID (will be set from authentication for workers)',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  worker_id?: number;

  @ApiProperty({
    description: 'Image URL for the portfolio item',
    example: '/uploads/portfolio/portfolio-1234567890.jpg'
  })
  @IsString()
  @IsNotEmpty()
  image_url: string;

  @ApiProperty({
    description: 'Description of the work shown in the image',
    example: 'مشروع تركيب إنارة LED حديثة في منزل سكني، شمل العمل تركيب جميع وحدات الإنارة وتمديد الأسلاك',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;
}