import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('app')
@Controller()
@ApiBearerAuth('JWT-auth')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiBearerAuth('JWT-auth')
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
