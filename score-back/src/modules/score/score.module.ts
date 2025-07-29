import { Module } from '@nestjs/common';
import { ScoreController } from './score.controller';
import { ScoreService } from './provider/score.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Score } from './entities/score.entity';
import { TransferScore } from './entities/transfer-score.entity';
import { UsedScore } from './entities/used-score.entity';
import { EventModule } from '../event/event.module';
import { AuthModule } from '../auth/auth.module';
import { BankCoreProvider } from './provider/coreBank.provider';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    AuthModule,
    // RedisModule,
    TypeOrmModule.forFeature([Score, TransferScore, UsedScore]),
    EventModule,
    CacheModule.register(),
  ],
  controllers: [ScoreController],
  providers: [ScoreService, BankCoreProvider],
})
export class ScoreModule {}
