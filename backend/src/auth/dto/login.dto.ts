import { IsString, IsNotEmpty, Length, IsOptional, ValidateIf } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  @Length(8, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 255)
  password: string;

  // Custom validation: either phone or email must be provided
  @ValidateIf(o => !o.phone && !o.email)
  @IsNotEmpty({ message: 'Either phone or email must be provided' })
  phoneOrEmail?: string;
}