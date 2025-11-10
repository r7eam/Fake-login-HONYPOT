import { PartialType } from '@nestjs/mapped-types';
import { CreateProfessionDto } from './create-professions.dto';

export class UpdateProfessionDto extends PartialType(CreateProfessionDto) {}