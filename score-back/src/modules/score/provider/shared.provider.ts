import {
  Injectable,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
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
import { TransferScore } from '../entities/transfer-score.entity';
import { TransferScoreDescription } from '../entities/transfer-score-description.entity';
import { UsedScoreDescription } from '../entities/used-score-description.entity';

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
    @InjectRepository(TransferScore)
    private readonly transferScoreRepository: Repository<TransferScore>,
    @InjectRepository(TransferScoreDescription)
    private readonly transferScoreDescriptionRepository: Repository<TransferScoreDescription>,
    @InjectRepository(UsedScoreDescription)
    private readonly usedScoreDescriptionRepository: Repository<UsedScoreDescription>,
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
        [nationalCode, Number(this.staleMonths), 0],
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
    nationalCode: number,
    accountNumber: number,
    score: number,
    personalCode: number,
    referenceCode: number | null,
    description: string | null,
  ) {
    try {
      const resultScores = await this.getScore(accountNumber, nationalCode);

      if (!resultScores || resultScores.length === 0) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'shared.provider',
            method: 'usedScore',
            message: `There is no record in Scores for nationalCode:${nationalCode} and accountNumber:${accountNumber}`,
            requestBody: JSON.stringify({
              nationalCode,
              accountNumber,
              score,
            }),
            stack: '',
          }),
        );
        //throw new NotFoundException(ErrorMessages.NOT_FOUND);
        throw new NotFoundException({
          message: ErrorMessages.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
        });
      }
      const scoreRec = resultScores[0];

      const now = new Date();
      const formattedDate = now
        .toISOString()
        .slice(2, 10) // skip "20", take "25-MM-DD"
        .replace(/-/g, ''); // YYMMDD

      const timePart = Number(
        now
          .toTimeString() // "16:42:05 GMT+0200 ..."
          .slice(0, 8) // "16:42:05"
          .replace(/:/g, ''),
      ).toString(); // "164205"

      if (Number(scoreRec.usableScore) < score) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'shared.provider',
            method: 'consumeScore',
            message: `Insufficient score to use for nationalCode:${nationalCode} and accountNumber:${accountNumber} requiredScore:${score} currentUsableScore:${scoreRec.usableScore}`,
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
      let UseScore: any[] = [];
      if (personalCode)
        personnelData = await this.authService.getPersonalData(personalCode);
      let remaindscore = score;

      const localReferenceCode =
        referenceCode ??
        Number(
          `${formattedDate}${timePart}${Number(personnelData?.branchCode.slice(-2)).toString()}`,
        );
      const validScores = await this.getValidScores(
        Number(scoreRec.accountNumber),
        Number(scoreRec.nationalCode),
      );

      for (const validScore of validScores) {
        if (remaindscore === 0) break;
        if (Number(validScore.usableScore) === 0) continue;
        if (Number(validScore.usableScore) <= remaindscore) {
          remaindscore -= Number(validScore.usableScore);
          const localUseScore = this.UsedScoreRepository.create({
            usedScore: { id: validScore.id },
            score: Number(validScore.usableScore),
            personalCode: personalCode ? Number(personalCode) : null,
            branchCode: personnelData?.branchCode
              ? Number(personnelData?.branchCode)
              : null,
            branchName: personnelData?.branchName ?? null,
            referenceCode: localReferenceCode,
          });
          UseScore.push(localUseScore);
        } else {
          const localUseScore = this.UsedScoreRepository.create({
            usedScore: { id: validScore.id },
            score: remaindscore,
            personalCode: personalCode ? Number(personalCode) : null,
            branchCode: personnelData?.branchCode
              ? Number(personnelData?.branchCode)
              : null,
            branchName: personnelData?.branchName ?? null,
            referenceCode: localReferenceCode,
          });
          remaindscore = 0;
          UseScore.push(localUseScore);
        }
      }

      await this.UsedScoreRepository.save(UseScore);
      if (description) {
        const transferDesc = this.usedScoreDescriptionRepository.create({
          referenceCode: localReferenceCode,
          description,
        });
        await this.usedScoreDescriptionRepository.save(transferDesc);
      }
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'shared.provider',
          method: 'consumeScore',
          message: `use successfully nationalCode:${scoreRec.nationalCode} accountNumber:${scoreRec.accountNumber} score:${score} by personalCode:${personalCode} branchCode:${personnelData?.branchCode} and referenceCode:${referenceCode ?? Number(`${formattedDate}${timePart}${personnelData?.branchCode}`)}`,
          requestBody: JSON.stringify({
            scoreId: scoreRec?.id,
            personalCode,
            referenceCode: localReferenceCode,
            nationalCode: scoreRec.nationalCode,
            accountNumber: scoreRec.accountNumber,
            usableScore: scoreRec.usableScore,
            requestScore: score,
          }),
          stack: '',
        }),
      );
      return { message: ErrorMessages.SUCCESSFULL, statusCode: 200 };
    } catch (error) {
      handelError(error, this.eventEmitter, 'score.service', 'consumeScore', {
        nationalCode,
        accountNumber,
        score,
        personalCode,
      });
    }
  }

  // Update the transferScore method signature to include description
  async transferScore(
    fromNationalCode: number,
    toNationalCode: number,
    fromAccountNumber: number,
    toAccountNumber: number,
    score: number,
    personalCode: number,
    referenceCode: number | null,
    description?: string,
  ) {
    try {
      const resultScores = await this.getScore(
        fromAccountNumber,
        fromNationalCode,
      );

      if (!resultScores || resultScores.length === 0) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'shared.provider',
            method: 'transferScore',
            message: `There is no record in Scores for nationalCode:${fromNationalCode} and accountNumber:${fromAccountNumber}`,
            requestBody: JSON.stringify({
              fromNationalCode,
              fromAccountNumber,
              toAccountNumber,
              toNationalCode,
              score,
              personalCode,
              referenceCode,
            }),
            stack: '',
          }),
        );
        //throw new NotFoundException(ErrorMessages.NOT_FOUND);
        throw new NotFoundException({
          message: ErrorMessages.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
        });
      }
      const scoreRec = resultScores[0];
      const now = new Date();
      const formattedDate = now
        .toISOString()
        .slice(2, 10) // skip "20", take "25-MM-DD"
        .replace(/-/g, ''); // YYMMDD

      const timePart = Number(
        now
          .toTimeString() // "16:42:05 GMT+0200 ..."
          .slice(0, 8) // "16:42:05"
          .replace(/:/g, ''),
      ).toString(); // "164205"

      if (Number(scoreRec.transferableScore) < score) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'shared.provider',
            method: 'transferScore',
            message: `Insufficient score to transfer from nationalCode:${fromNationalCode} and accountNumber:${fromAccountNumber} to nationalCode:${toNationalCode} and accountNumber:${toAccountNumber} currentScore is:${scoreRec.usableScore} and requestScore is ${score}`,
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
      if (personalCode)
        personnelData = await this.authService.getPersonalData(personalCode);
      let remaindscore = score;
      const validScores = await this.getValidScores(
        Number(scoreRec.accountNumber),
        Number(scoreRec.nationalCode),
      );

      const localReferenceCode =
        referenceCode ??
        Number(
          `${formattedDate}${timePart}${Number(personnelData?.branchCode.slice(-2)).toString()}`,
        );

      for (const validScore of validScores) {
        if (remaindscore === 0) break;
        if (Number(validScore.transferableScore) === 0) continue;
        if (Number(validScore.transferableScore) <= remaindscore) {
          remaindscore -= Number(validScore.transferableScore);
          const localScore = this.scoreRepository.create({
            accountNumber: toAccountNumber,
            nationalCode: toNationalCode,
            score: 0,
            updatedAt: validScore.updated_at,
          });
          const savedScore = await this.scoreRepository.save(localScore);

          const localTransferScore = this.transferScoreRepository.create({
            fromScore: { id: validScore.id },
            toScore: { id: savedScore.id },
            score: validScore.transferableScore,
            personalCode: personalCode ? Number(personalCode) : null,
            branchCode: personnelData?.branchCode
              ? Number(personnelData?.branchCode)
              : null,
            referenceCode: localReferenceCode,
          });
          await this.transferScoreRepository.save(localTransferScore);
        } else {
          const localScore = this.scoreRepository.create({
            accountNumber: toAccountNumber,
            nationalCode: toNationalCode,
            score: 0,
            updatedAt: validScore.updated_at,
          });
          const savedScore = await this.scoreRepository.save(localScore);

          const localTransferScore = this.transferScoreRepository.create({
            fromScore: { id: validScore.id },
            toScore: { id: savedScore.id },
            score: remaindscore,
            personalCode: personalCode ? Number(personalCode) : null,
            branchCode: personnelData?.branchCode
              ? Number(personnelData?.branchCode)
              : null,
            referenceCode: localReferenceCode,
          });
          await this.transferScoreRepository.save(localTransferScore);
          remaindscore = 0;
        }
      }
      if (description) {
        const transferDesc = this.transferScoreDescriptionRepository.create({
          referenceCode: localReferenceCode,
          description,
        });
        await this.transferScoreDescriptionRepository.save(transferDesc);
      }
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'shared.provider',
          method: 'transferScore',
          message: `transfer score successfully nationalCode:${fromNationalCode} accountNumber:${fromAccountNumber} to nationalCode:${toNationalCode} accountNumber:${toAccountNumber} score:${score} by personalCode:${personalCode} branchCode:${personnelData?.branchCode} and referenceCode:${referenceCode ?? Number(`${formattedDate}${timePart}${personnelData?.branchCode}`)}`,
          requestBody: JSON.stringify({
            scoreId: scoreRec?.id,
            personalCode,
            nationalCode: scoreRec.nationalCode,
            accountNumber: scoreRec.accountNumber,
            usableScore: scoreRec.usableScore,
            requestScore: score,
            referenceCode: localReferenceCode,
          }),
          stack: '',
        }),
      );
      return { message: ErrorMessages.SUCCESSFULL, statusCode: 200 };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'shared.provider',
        'transferScore',
        {
          fromNationalCode,
          fromAccountNumber,
          toNationalCode,
          toAccountNumber,
          score,
          personalCode,
          referenceCode,
        },
      );
    }
  }

  // After saving transfer scores, save description if provided
}
