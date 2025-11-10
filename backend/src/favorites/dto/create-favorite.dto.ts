import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'Worker ID to add to favorites',
    example: 1
  })
  @IsNumber()
  @IsPositive()
  worker_id: number;
}