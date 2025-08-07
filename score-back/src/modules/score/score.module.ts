import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Score } from './entities/score.entity';
import { TransferScore } from './entities/transfer-score.entity';
import { UsedScore } from './entities/used-score.entity';
import { EventModule } from '../event/event.module';
import { AuthModule } from '../auth/auth.module';
import { BankCoreProvider } from './provider/coreBank.provider';
import { CacheModule } from '@nestjs/cache-manager';
import { FrontScoreController } from './controllers/front-score.controller';
import { APIScoreController } from './controllers/api-score.controller';
import { FrontScoreService } from './provider/front-score.service';
import { ApiScoreService } from './provider/api-score.service';
import { SharedProvider } from './provider/shared.provider';

@Module({
  imports: [
    AuthModule,
    // RedisModule,
    TypeOrmModule.forFeature([Score, TransferScore, UsedScore]),
    EventModule,
    CacheModule.register(),
  ],
  controllers: [FrontScoreController, APIScoreController],
  providers: [
    FrontScoreService,
    ApiScoreService,
    BankCoreProvider,
    SharedProvider,
  ],
})
export class ScoreModule {}
