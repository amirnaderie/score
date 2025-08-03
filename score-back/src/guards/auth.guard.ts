import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/modules/auth/provider/auth.service';
import { User } from 'src/interfaces/user.interface';

interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = request.cookies['accessToken'];

    if (!token) {
      throw new UnauthorizedException('خطا احراز هویت');
    }
    try {
      const payload = await this.authService.verifyToken(token);
      request.user = { id: payload.id, userName: payload.username, roles: payload.roles };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('خطا احراز هویت');
    }
    return true;
  }
}
