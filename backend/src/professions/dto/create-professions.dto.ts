import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfessionDto {
  @ApiProperty({
    description: 'Profession name in Arabic',
    example: 'كهربائي'
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the profession',
    example: 'إصلاح وصيانة الأجهزة الكهربائية والإنارة المنزلية والتجارية',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Whether the profession is active',
    example: true,
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}