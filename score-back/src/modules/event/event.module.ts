// src/events/event.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Logs } from './entities/log.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventEmitter2 } from 'eventemitter2';
import { EventHandler } from './event.handler';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Logs])],
  providers: [EventHandler],
})
export class EventModule { }