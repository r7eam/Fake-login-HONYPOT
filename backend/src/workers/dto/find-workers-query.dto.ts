import { IsOptional, IsString, IsNumber, IsBoolean, IsIn, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FindWorkersQueryDto {
  // Filters
  @ApiProperty({
    description: 'Filter by profession ID',
    example: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  profession_id?: number;

  @ApiProperty({
    description: 'Filter by neighborhood ID',
    example: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  neighborhood_id?: number;

  @ApiProperty({
    description: 'Filter by area name (Arabic)',
    example: 'الساحل الأيمن',
    enum: ['الساحل الأيمن', 'الساحل الأيسر'],
    required: false
  })
  @IsOptional()
  @IsString()
  @IsIn(['الساحل الأيمن', 'الساحل الأيسر'])
  area?: 'الساحل الأيمن' | 'الساحل الأيسر';

  @ApiProperty({
    description: 'Filter by availability status',
    example: true,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_available?: boolean;

  @ApiProperty({
    description: 'Minimum rating filter (0-5)',
    example: 4,
    minimum: 0,
    maximum: 5,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  min_rating?: number;

  @ApiProperty({
    description: 'Search in worker name and bio',
    example: 'كهربائي',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string; // Search in name, bio

  // Sorting
  @ApiProperty({
    description: 'Sort workers by field',
    example: 'rating',
    enum: ['rating', 'experience', 'jobs', 'recent', 'name'],
    required: false,
    default: 'recent'
  })
  @IsOptional()
  @IsString()
  @IsIn(['rating', 'experience', 'jobs', 'recent', 'name'])
  sort?: 'rating' | 'experience' | 'jobs' | 'recent' | 'name';

  @ApiProperty({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    required: false,
    default: 'DESC'
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';

  // Pagination
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    required: false,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}