import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateRequestDto } from './create-request.dto';

export class UpdateRequestDto extends PartialType(
  OmitType(CreateRequestDto, ['status', 'rejected_reason'] as const)
) {}