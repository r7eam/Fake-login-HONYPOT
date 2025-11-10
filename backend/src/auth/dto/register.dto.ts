import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, IsIn, IsNumber, IsPositive } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 255)
  password: string;

  @IsIn(['client', 'worker', 'admin'])
  role: 'client' | 'worker' | 'admin';

  @IsOptional()
  @IsNumber()
  @IsPositive()
  neighborhood_id?: number;

  @IsOptional()
  @IsString()
  profile_image?: string;

  // Additional fields for worker registration
  @IsOptional()
  @IsNumber()
  @IsPositive()
  profession_id?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  experience_years?: number;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  contact_phone?: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  whatsapp_number?: string;
}