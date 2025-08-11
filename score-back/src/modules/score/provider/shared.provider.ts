import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsedScore } from '../entities/used-score.entity';
import { ScoreInterface } from '../interfaces/score.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { logTypes } from '../../../modules/event/enums/logType.enum';
import { ErrorMessages } from '../../../constants/error-messages.constants';
import handelError from '../../../utility/handel-error';
import { AuthService } from 'src/modules/auth/provider/auth.service';
import { LogEvent } from 'src/modules/event/providers/log.event';
import { Score } from '../entities/score.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SharedProvider {
  private staleMonths: string;

  constructor(
    private eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    @InjectRepository(UsedScore)
    private readonly UsedScoreRepository: Repository<UsedScore>,
    @InjectRepository(Score)
    private readonly scoreRepository: Repository<Score>,
    private readonly dataSource: DataSource,

  ) {
    this.staleMonths = this.configService.get<string>('SCORE_STALE_MONTHS');
  }

  async getScoresRowsBynationalCode(nationalCode: number) {
    try {
      // const scoreRow = await this.scoreRepository.query(
      //   'exec getScoresOfNationalCode @nationalCode=@0',
      //   [nationalCode],
      // );
      const scoreRow = await this.scoreRepository.query(
        'exec getScoresOfNationalCode @0, @1, @2',
        [nationalCode, Number(this.staleMonths), 0]
      );
      return scoreRow;
    } catch (error) {
      throw error;
    }
  }
  async getValidScores(accountNumber: number, nationalCode: number) {
    try {
      const query = `SELECT * FROM dbo.getValidScoresFunction(@0,@1,@2,@3)`;
      const scoreRecs = await this.dataSource.query(query, [
        accountNumber,
        nationalCode,
        Number(this.staleMonths),
        0,
      ]);
      return scoreRecs;
    } catch (error) {
      throw error;
    }
  }

  async consumeScore(
    scoreRec: Partial<ScoreInterface>[] | null,
    score: number,
    personalCode: number,
    referenceCode: number | null,
  ) {
    try {
      if (scoreRec[0].usableScore! < score) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'score.service',
            method: 'consumeScore',
            message: 'Insufficient score to use',
            requestBody: JSON.stringify({
              scoreId: scoreRec[0]?.id,
              personalCode,
              referenceCode,
              nationalCode: scoreRec[0].nationalCode,
              accountNumber: scoreRec[0].accountNumber,
              usableScore: scoreRec[0].usableScore,
              requestScore: score,
            }),
            stack: '',
          }),
        );
        throw new BadRequestException({
          message: ErrorMessages.INSUFFICIENT_SCORE,
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
        });
      }
      let personnelData: any = null;

      if (personalCode)
        personnelData = await this.authService.getPersonalData(personalCode);

      const UseScore = this.UsedScoreRepository.create({
        usedScore: { id: scoreRec[0].id },
        score: score,
        personalCode: personalCode ? Number(personalCode) : null,
        branchCode: personnelData?.branchCode
          ? Number(personnelData?.branchCode)
          : null,
        branchName: personnelData?.branchName ?? null,
        referenceCode: referenceCode,
      });
      await this.UsedScoreRepository.save(UseScore);
      return { message: ErrorMessages.SUCCESSFULL, statusCode: 200 };
    } catch (error) {
      handelError(error, this.eventEmitter, 'score.service', 'consumeScore', {
        scoreId: scoreRec[0]?.id,
      });
    }
  }
}
