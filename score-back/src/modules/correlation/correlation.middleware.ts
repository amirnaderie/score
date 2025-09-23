import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CorrelationService } from './correlation.service';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    CorrelationService.run(() => {
      const correlationId = CorrelationService.getCorrelationId();
      
      // Add correlation ID to response headers for debugging
      res.setHeader('X-Correlation-ID', correlationId);
      
      // Add correlation ID to request object for easy access
      (req as any).correlationId = correlationId;
      
      next();
    });
  }
}