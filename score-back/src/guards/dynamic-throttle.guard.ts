import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DynamicThrottleGuard implements CanActivate {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private readonly logger = new Logger(DynamicThrottleGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.maxRequests = Number(this.configService.get('THROTTLE_MAX_REQUESTS')) || 20;
    this.logger.log(`Throttle value loaded from .env: ${this.maxRequests}`);
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 10 * 1000; // 10 seconds
    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }
    const timestamps = this.requests.get(ip)!;
    // Remove timestamps older than window
    while (timestamps.length && now - timestamps[0] > windowMs) {
      timestamps.shift();
    }
    if (timestamps.length >= this.maxRequests) {
      return false;
    }
    timestamps.push(now);
    return true;
  }
}
