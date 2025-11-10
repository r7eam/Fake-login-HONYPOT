import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkerPortfolioDto } from './create-worker-portfolio.dto';

export class UpdateWorkerPortfolioDto extends PartialType(CreateWorkerPortfolioDto) {}