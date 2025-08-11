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

  async getScore(accountNumber: number, nationalCode: number) {
    try {
      const query = `SELECT * FROM dbo.getScoresFunction(@0,@1,@2,@3)`;
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
    scoreRec: ScoreInterface,
    score: number,
    personalCode: number,
    referenceCode: number | null,
  ) {
    try {

      const now = new Date();
      const formattedDate = now
        .toISOString()
        .slice(2, 10) // skip "20", take "25-MM-DD"
        .replace(/-/g, ''); // YYMMDD

      const timePart = now
        .toTimeString() // "16:42:05 GMT+0200 ..."
        .slice(0, 8)    // "16:42:05"
        .replace(/:/g, ''); // "164205"

      if (Number(scoreRec.usableScore) < score) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'score.service',
            method: 'consumeScore',
            message: 'Insufficient score to use',
            requestBody: JSON.stringify({
              scoreId: scoreRec?.id,
              personalCode,
              referenceCode,
              nationalCode: scoreRec.nationalCode,
              accountNumber: scoreRec.accountNumber,
              usableScore: scoreRec.usableScore,
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
      let UseScore: any[] = []
      if (personalCode)
        personnelData = await this.authService.getPersonalData(personalCode);
      let remaindscore = score
      const validScores = await this.getValidScores(Number(scoreRec.accountNumber), Number(scoreRec.nationalCode))

      for (const validScore of validScores) {
        if (remaindscore === 0)
          break;
        if (Number(validScore.usableScore) <= remaindscore) {
          remaindscore -= Number(validScore.usableScore)
          const localUseScore = this.UsedScoreRepository.create({
            usedScore: { id: validScore.id },
            score: Number(validScore.usableScore),
            personalCode: personalCode ? Number(personalCode) : null,
            branchCode: personnelData?.branchCode
              ? Number(personnelData?.branchCode)
              : null,
            branchName: personnelData?.branchName ?? null,
            referenceCode: referenceCode ?? Number(`${formattedDate}${timePart}${personnelData?.branchCode}`),
          });
          UseScore.push(localUseScore)
        }
        else {
          const localUseScore = this.UsedScoreRepository.create({
            usedScore: { id: validScore.id },
            score: remaindscore,
            personalCode: personalCode ? Number(personalCode) : null,
            branchCode: personnelData?.branchCode
              ? Number(personnelData?.branchCode)
              : null,
            branchName: personnelData?.branchName ?? null,
            referenceCode: referenceCode ?? Number(`${formattedDate}${timePart}${personnelData?.branchCode}`),
          });
          remaindscore = 0
          UseScore.push(localUseScore)
        }
      }

      // const UseScore = this.UsedScoreRepository.create({
      //   usedScore: { id: scoreRec.id },
      //   score: score,
      //   personalCode: personalCode ? Number(personalCode) : null,
      //   branchCode: personnelData?.branchCode
      //     ? Number(personnelData?.branchCode)
      //     : null,
      //   branchName: personnelData?.branchName ?? null,
      //   referenceCode: referenceCode,
      // });
      await this.UsedScoreRepository.save(UseScore);
      return { message: ErrorMessages.SUCCESSFULL, statusCode: 200 };
    } catch (error) {
      handelError(error, this.eventEmitter, 'score.service', 'consumeScore', {
        scoreId: scoreRec[0]?.id,
      });
    }
  }
}
