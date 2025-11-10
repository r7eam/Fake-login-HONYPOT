import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { JwtStrategy } from './jwt-auth';
import { UsersModule } from '../../users/users.module';
import { WorkersModule } from '../../workers/workers.module';
import type { StringValue } from 'ms';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        return {
          secret: configService.get<string>('JWT_SECRET') || 'craft_mosul_secret_key',
          signOptions: { 
            expiresIn: expiresIn as StringValue
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    WorkersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}