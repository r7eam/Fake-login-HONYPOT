import { IsNotEmpty, IsOptional, IsString, IsNumber, IsPositive, IsBoolean, IsUrl, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkerDto {
  @ApiProperty({
    description: 'User ID of the worker (optional, will be set from authentication)',
    example: 2,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  user_id?: number;

  @ApiProperty({
    description: 'Profession ID',
    example: 1
  })
  @IsNumber()
  @IsPositive()
  profession_id: number;

  @ApiProperty({
    description: 'Worker bio/description',
    example: 'كهربائي محترف مع خبرة 5 سنوات في صيانة وتركيب الأجهزة الكهربائية والإنارة المنزلية والتجارية',
    required: false
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: 'Years of experience',
    example: 5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  experience_years?: number;

  // Contact information
  @ApiProperty({
    description: 'Contact phone number',
    example: '07901234568',
    required: false,
    minLength: 8,
    maxLength: 20
  })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  contact_phone?: string;

  @ApiProperty({
    description: 'WhatsApp number',
    example: '07901234568',
    required: false,
    minLength: 8,
    maxLength: 20
  })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  whatsapp_number?: string;

  @ApiProperty({
    description: 'Facebook profile URL',
    example: 'https://facebook.com/mohammed.electrician',
    required: false
  })
  @IsOptional()
  @IsUrl()
  facebook_url?: string;

  @ApiProperty({
    description: 'Instagram profile URL',
    example: 'https://instagram.com/mohammed_electrician',
    required: false
  })
  @IsOptional()
  @IsUrl()
  instagram_url?: string;

  // Status
  @ApiProperty({
    description: 'Worker availability status',
    example: true,
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  // Profile image
  @ApiProperty({
    description: 'Profile image URL',
    example: '/uploads/worker-profiles/worker-profile-123.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  profile_image?: string;
}