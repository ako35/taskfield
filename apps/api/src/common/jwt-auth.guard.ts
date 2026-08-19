import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { UserRole } from '../modules/auth/users.repository';

export interface AuthenticatedRequest extends Request {
  user: { id: string; role: UserRole };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Oturum açmanız gerekiyor.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        role: UserRole;
      }>(token);
      request.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Oturum geçersiz veya süresi dolmuş.');
    }
  }
}
