import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {
  @ApiProperty({
    description: 'Client ID (will be set from authentication)',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  client_id?: number;

  @ApiProperty({
    description: 'Worker ID to assign the request to',
    example: 1
  })
  @IsNumber()
  @IsPositive()
  worker_id: number;

  @ApiProperty({
    description: 'Description of the problem or service needed',
    example: 'مشكلة في الكهرباء بالمطبخ، الإنارة لا تعمل والمقابس لا تحتوي على تيار كهربائي'
  })
  @IsString()
  @IsNotEmpty()
  problem_description: string;

  @ApiProperty({
    description: 'Request status',
    example: 'pending',
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    required: false,
    default: 'pending'
  })
  @IsOptional()
  @IsIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
  status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

  @ApiProperty({
    description: 'Reason for rejection (only for rejected status)',
    example: 'غير متوفر في الوقت المحدد',
    required: false
  })
  @IsOptional()
  @IsString()
  rejected_reason?: string;
}