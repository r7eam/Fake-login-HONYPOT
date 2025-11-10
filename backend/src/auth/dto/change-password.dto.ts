import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'oldpassword123',
    minLength: 6,
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 255)
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'newpassword456',
    minLength: 6,
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 255)
  newPassword: string;
}