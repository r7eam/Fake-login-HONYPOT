import { PartialType } from '@nestjs/mapped-types';
import { CreateNeighborhoodDto } from './create-neighborhoods.dto';

export class UpdateNeighborhoodDto extends PartialType(CreateNeighborhoodDto) {}