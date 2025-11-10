import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, IsIn, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @Length(8, 20)
  phone: string;

  @IsString()
  @Length(6, 255)
  password: string;

  @IsIn(['client', 'worker', 'admin'])
  role: 'client' | 'worker' | 'admin';

  @IsOptional()
  neighborhood_id?: number;

  @IsOptional()
  profile_image?: string;

  @IsOptional()
  @IsBoolean()
  email_verified?: boolean;

  @IsOptional()
  @IsBoolean()
  phone_verified?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
