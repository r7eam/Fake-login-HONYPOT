import { IsNumber, IsPositive, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID of the completed request being reviewed',
    example: 1
  })
  @IsNumber()
  @IsPositive()
  request_id: number;

  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review comment or feedback',
    example: 'عمل ممتاز وسريع، الكهربائي محترف جداً وأنهى العمل في الوقت المحدد',
    required: false
  })
  @IsOptional()
  @IsString()
  comment?: string;
}