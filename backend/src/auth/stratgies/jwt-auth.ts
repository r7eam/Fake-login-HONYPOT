import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: number;
  phone: string;
  role: 'client' | 'worker';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'craft_mosul_secret_key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }
    
    // Update last login
    await this.usersService.updateLastLogin(user.id);
    
    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      email: user.email,
      neighborhood_id: user.neighborhood_id,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
    };
  }
}