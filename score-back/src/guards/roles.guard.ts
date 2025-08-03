import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ErrorMessages } from 'src/constants/error-messages.constants';
import { User } from 'src/interfaces/user.interface';

interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    // If no roles are required, skip this guard
    if (!requiredRoles) return true;
    
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    
    // If no user is present, authentication is required but not provided
    if (!user) {
      throw new ForbiddenException(ErrorMessages.FORBIDDEN);
    }
    
    const hasRequiredRole = user.roles && requiredRoles.some((role) => user.roles.includes(role));
    
    if (!hasRequiredRole) {
      throw new ForbiddenException(ErrorMessages.FORBIDDEN);
    }
    
    return true;
  }
}
