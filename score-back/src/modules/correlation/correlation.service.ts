import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { v4 as uuidv4 } from 'uuid';

interface CorrelationContext {
  correlationId: string;
}

@Injectable()
export class CorrelationService {
  private static asyncLocalStorage = new AsyncLocalStorage<CorrelationContext>();

  static run<T>(fn: () => T): T {
    const correlationId = uuidv4();
    return this.asyncLocalStorage.run({ correlationId }, fn);
  }

  static getCorrelationId(): string | undefined {
    const context = this.asyncLocalStorage.getStore();
    return context?.correlationId;
  }

  static setCorrelationId(correlationId: string): void {
    const context = this.asyncLocalStorage.getStore();
    if (context) {
      context.correlationId = correlationId;
    }
  }

  getCorrelationId(): string | undefined {
    return CorrelationService.getCorrelationId();
  }
}