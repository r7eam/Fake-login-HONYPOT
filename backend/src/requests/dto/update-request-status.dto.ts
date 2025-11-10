import { IsIn, IsString, IsNotEmpty, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRequestStatusDto {
  @ApiProperty({
    description: 'New request status',
    example: 'accepted',
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled']
  })
  @IsIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

  @ApiProperty({
    description: 'Reason for rejection (required only when status is rejected)',
    example: 'غير متوفر في الوقت المحدد حاليا، يرجى المحاولة في وقت لاحق',
    required: false
  })
  @ValidateIf(o => o.status === 'rejected')
  @IsString()
  @IsNotEmpty()
  rejected_reason?: string;
}