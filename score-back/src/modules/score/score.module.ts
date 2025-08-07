import { Module } from '@nestjs/common';
import { ScoreService } from './provider/score.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Score } from './entities/score.entity';
import { TransferScore } from './entities/transfer-score.entity';
import { UsedScore } from './entities/used-score.entity';
import { EventModule } from '../event/event.module';
import { AuthModule } from '../auth/auth.module';
import { BankCoreProvider } from './provider/coreBank.provider';
import { CacheModule } from '@nestjs/cache-manager';
import { FrontScoreController } from './controllers/frontScore.controller';
import { APIScoreController } from './controllers/apiScore.controller';

@Module({
  imports: [
    AuthModule,
    // RedisModule,
    TypeOrmModule.forFeature([Score, TransferScore, UsedScore]),
    EventModule,
    CacheModule.register(),
  ],
  controllers: [FrontScoreController, APIScoreController],
  providers: [ScoreService, BankCoreProvider],
})
export class ScoreModule {}
