import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNeighborhoodDto {
  @ApiProperty({
    description: 'Neighborhood name in Arabic',
    example: 'الكرامة'
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Area where the neighborhood is located',
    example: 'الساحل الأيمن',
    enum: ['الساحل الأيمن', 'الساحل الأيسر']
  })
  @IsString()
  @IsIn(['الساحل الأيمن', 'الساحل الأيسر'])
  area: 'الساحل الأيمن' | 'الساحل الأيسر';
}