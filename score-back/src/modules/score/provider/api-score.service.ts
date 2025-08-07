import {
  BadRequestException,
  Injectable,
  NotFoundException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Score } from '../entities/score.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogEvent } from '../../../modules/event/log.event';
import { logTypes } from '../../../modules/event/enums/logType.enum';
import { ErrorMessages } from '../../../constants/error-messages.constants';
import handelError from '../../../utility/handel-error';
import { TransferScore } from '../entities/transfer-score.entity';
import { UsedScore } from '../entities/used-score.entity';
import { ScoreInterface } from '../interfaces/score.interface';
import { BankCoreProvider } from './coreBank.provider';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/modules/auth/provider/auth.service';
import { ConsumeScoreProvider } from './consume-score.provider';
const moment = require('moment-jalaali');

@Injectable()
export class ApiScoreService {
  constructor(
    private eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
    @InjectRepository(Score)
    private readonly scoreRepository: Repository<Score>,
    @InjectRepository(TransferScore)
    private readonly TransferScoreRepository: Repository<TransferScore>,
    @InjectRepository(UsedScore)
    private readonly UsedScoreRepository: Repository<UsedScore>,
    private readonly bankCoreProvider: BankCoreProvider,
    private readonly configService: ConfigService,
    private readonly consumeScoreProvider: ConsumeScoreProvider,
  ) {}

  public async findByNationalCode(nationalCode: number) {
    let scoresOfNationalCode: Partial<Score>[] | null;
    let scoresRec: any[] = [];

    try {
      scoresOfNationalCode = await this.scoreRepository.find({
        where: {
          nationalCode: nationalCode,
        },
      });

      if (!scoresOfNationalCode || scoresOfNationalCode.length === 0) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'score.service',
            method: 'findOneByNationalCode',
            message: 'ُThere is no record for given nationalCode',
            requestBody: JSON.stringify({ nationalCode: nationalCode }),
            stack: '',
          }),
        );
        throw new NotFoundException({
          data: [],
          message: ErrorMessages.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
        });
        // throw new NotFoundException(ErrorMessages.NOT_FOUND);
      }
      for (const score of scoresOfNationalCode) {
        const scoreRec = await this.scoreRepository.query(
          'exec getScores @nationalCode=@0,@accountNumber=@1',
          [score.nationalCode, score.accountNumber],
        );
        scoresRec.push({
          accountNumber: score.accountNumber,
          usableScore: scoreRec[0].usableScore,
          transferableScore: scoreRec[0].transferableScore,
          depositType: '1206',
          updatedAt: moment(score.updatedAt).format('jYYYY/jMM/jDD'),
        });
      }

      return {
        data: scoresRec,
        message: ErrorMessages.SUCCESSFULL,
        statusCode: 200,
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'score.service',
        'findOneByNationalCode',
        { nationalCode: nationalCode },
      );
    }
  }

  public async transferScore(
    fromNationalCode: number,
    toNationalCode: number,
    fromAccountNumber: number,
    toAccountNumber: number,
    score: number,
    userId: string,
    referenceCode: number | null,
  ) {
    let scoreRec: Partial<ScoreInterface>[] | null;

    try {
      if (
        score > Number(this.configService.get<string>('MAX_TRANSFERABLE_SCORE'))
      ) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'score.service',
            method: 'transferScore',
            message: ErrorMessages.OVERFLOW_MAX_TRANSFERABLE_SCORE,
            requestBody: JSON.stringify({
              fromNationalCode,
              fromAccountNumber,
              score,
              MAX_TRANSFERABLE_SCORE: this.configService.get<string>(
                'MAX_TRANSFERABLE_SCORE',
              ),
            }),
            stack: '',
          }),
        );
        throw new BadRequestException({
          message: ErrorMessages.OVERFLOW_MAX_TRANSFERABLE_SCORE,
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
        });
      }

      if (
        fromNationalCode === toNationalCode ||
        fromAccountNumber === toAccountNumber
      ) {
        throw new BadRequestException({
          message: ErrorMessages.VALIDATE_INFO_FAILED,
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
        });
      }

      try {
        const scoreFromOwner =
          await this.bankCoreProvider.getCustomerBriefDetail(toNationalCode);
        const scoreToOwner =
          await this.bankCoreProvider.getCustomerBriefDetail(fromNationalCode);
        const { depositStatus: depositStatusFrom } =
          await this.bankCoreProvider.getDepositDetail(scoreFromOwner.cif, [
            fromAccountNumber,
          ]);
        const { depositStatus: depositStatusTo } =
          await this.bankCoreProvider.getDepositDetail(scoreToOwner.cif, [
            toAccountNumber,
          ]);
        if (depositStatusFrom !== 'OPEN' || depositStatusTo !== 'OPEN') {
          this.eventEmitter.emit(
            'logEvent',
            new LogEvent({
              logTypes: logTypes.INFO,
              fileName: 'score.service',
              method: 'transferScore',
              message: `fromAccountNumber or toAccountNumber is close`,
              requestBody: JSON.stringify({
                fromAccountNumber,
                toAccountNumber,
              }),
              stack: '',
            }),
          );

          throw new BadRequestException({
            message: ErrorMessages.NOTACTIVE,
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
          });
        }
      } catch (error) {}

      if (referenceCode) {
        const foundReferenceCode = await this.TransferScoreRepository.findOne({
          where: {
            referenceCode,
          },
        });
        if (foundReferenceCode)
          throw new ConflictException({
            message: ErrorMessages.REPETITIVE_INFO_FAILED,
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
          });
      }

      scoreRec = await this.scoreRepository.query(
        'exec getScores @nationalCode=@0,@accountNumber=@1',
        [fromNationalCode, fromAccountNumber],
      );
      if (!scoreRec || scoreRec.length === 0 || !scoreRec[0]?.id) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'score.service',
            method: 'transferScore',
            message:
              'ُThere is no record for given fromNationalCode and fromAccountNumber',
            requestBody: JSON.stringify({
              fromNationalCode,
              fromAccountNumber,
              toNationalCode,
              toAccountNumber,
              score,
              referenceCode: referenceCode ? referenceCode : null,
            }),
            stack: '',
          }),
        );
        throw new NotFoundException({
          message: ErrorMessages.SENDER_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
        });
      }
      if (scoreRec[0].transferableScore! < score) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'score.service',
            method: 'transferScore',
            message: 'Insufficient score to transfer',
            requestBody: JSON.stringify({
              fromNationalCode,
              fromAccountNumber,
              toNationalCode,
              toAccountNumber,
              score,
              referenceCode: referenceCode ? referenceCode : null,
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
      const toRec = await this.scoreRepository.findOne({
        where: {
          nationalCode: toNationalCode,
          accountNumber: toAccountNumber,
        },
      });
      if (!toRec) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'score.service',
            method: 'transferScore',
            message:
              'ُThere is no record for given toNationalCode and toAccountNumber',
            requestBody: JSON.stringify({
              toNationalCode,
              toAccountNumber,
              score,
            }),
            stack: '',
          }),
        );
        throw new NotFoundException({
          message: ErrorMessages.RECIEVER_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
        });
      }

      const TransferScore = this.TransferScoreRepository.create({
        fromScore: { id: scoreRec[0].id },
        toScore: { id: toRec.id },
        score,
        userId,
        referenceCode,
      });
      await this.TransferScoreRepository.save(TransferScore);
      return { message: ErrorMessages.SUCCESSFULL, statusCode: 200 };
    } catch (error) {
      handelError(error, this.eventEmitter, 'score.service', 'transferScore', {
        fromNationalCode,
        toNationalCode,
        score,
      });
    }
  }

  public async usedScore(
    nationalCode: number,
    accountNumber: number,
    score: number,
    referenceCode: number | null,
  ) {
    if (referenceCode) {
      const foundReferenceCode = await this.UsedScoreRepository.findOne({
        where: {
          referenceCode,
        },
      });
      if (foundReferenceCode)
        throw new ConflictException({
          message: ErrorMessages.REPETITIVE_INFO_FAILED,
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
        });
    }
    try {
      const scoreOwner =
        await this.bankCoreProvider.getCustomerBriefDetail(nationalCode);
      const { depositStatus: depositStatus } =
        await this.bankCoreProvider.getDepositDetail(scoreOwner.cif, [
          accountNumber,
        ]);
      if (depositStatus !== 'OPEN') {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'score.service',
            method: 'consumeScore',
            message: 'ُthe Account is not open',
            requestBody: JSON.stringify({
              nationalCode,
              accountNumber,
              score,
            }),
            stack: '',
          }),
        );
        throw new BadRequestException({
          message: ErrorMessages.NOTACTIVE,
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
        });
      }
    } catch (error) {}

    const scoreRec: Partial<ScoreInterface>[] | null =
      await this.scoreRepository.query(
        'exec getScores @nationalCode=@0,@accountNumber=@1',
        [nationalCode, accountNumber],
      );
    if (!scoreRec || scoreRec.length === 0 || !scoreRec[0]?.id) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'score.service',
          method: 'consumeScore',
          message:
            'ُThere is no record for given nationalCode and accountNumber',
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

    return this.consumeScoreProvider.consumeScore(
      scoreRec,
      score,
      0,
      referenceCode,
    );
  }

  async getTransferScoreFrom(
    fromNationalCode: number,
    fromAccountNumber: number,
  ) {
    const coresRec = await this.scoreRepository.findOne({
      where: {
        nationalCode: fromNationalCode,
        accountNumber: fromAccountNumber,
      },
    });
    if (!coresRec)
      throw new NotFoundException({
        data: [],
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });

    const TransferScoreRec = await this.TransferScoreRepository.find({
      where: {
        fromScore: { id: coresRec.id },
      },
      relations: ['fromScore', 'toScore'],
    });

    const data = TransferScoreRec.map((ts) => ({
      score: ts.score,
      fromAccountNumber: ts.fromScore.accountNumber,
      fromNationalCode: ts.fromScore.nationalCode,
      toAccountNumber: ts.toScore.accountNumber,
      toNationalCode: ts.toScore.nationalCode,
      referenceCode: ts.referenceCode,
      createdAt: moment(ts.createdAt).format('jYYYY/jMM/jDD'),
    }));
    return {
      data,
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }

  async getTransferScoreTo(
    fromNationalCode: number,
    fromAccountNumber: number,
  ) {
    const coresRec = await this.scoreRepository.findOne({
      where: {
        nationalCode: fromNationalCode,
        accountNumber: fromAccountNumber,
      },
    });
    if (!coresRec)
      throw new NotFoundException({
        data: [],
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });
    const TransferScoreRec = await this.TransferScoreRepository.find({
      where: {
        toScore: { id: coresRec.id },
      },
      relations: ['fromScore', 'toScore'],
    });

    const data = TransferScoreRec.map((ts) => ({
      score: ts.score,
      fromAccountNumber: ts.fromScore.accountNumber,
      fromNationalCode: ts.fromScore.nationalCode,
      toAccountNumber: ts.toScore.accountNumber,
      toNationalCode: ts.toScore.nationalCode,
      referenceCode: ts.referenceCode,
      createdAt: moment(ts.createdAt).format('jYYYY/jMM/jDD'),
    }));
    return {
      data,
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }

  async getTransferByReferenceCode(referenceCode: number) {
    const TransferScoreRec = await this.TransferScoreRepository.findOne({
      where: {
        referenceCode,
      },
      relations: ['fromScore', 'toScore'],
    });
    if (!TransferScoreRec)
      throw new NotFoundException({
        data: {},
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });

    const data = {
      score: TransferScoreRec.score,
      fromAccountNumber: TransferScoreRec.fromScore.accountNumber,
      fromNationalCode: TransferScoreRec.fromScore.nationalCode,
      toAccountNumber: TransferScoreRec.toScore.accountNumber,
      toNationalCode: TransferScoreRec.toScore.nationalCode,
      referenceCode: TransferScoreRec.referenceCode,
      createdAt: moment(TransferScoreRec.createdAt).format('jYYYY/jMM/jDD'),
    };
    return {
      data,
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }
  async getUsedScoreByReferenceCode(referenceCode: number) {
    const usedScoreRec = await this.UsedScoreRepository.findOne({
      where: {
        referenceCode,
      },
      relations: ['usedScore'],
    });
    if (!usedScoreRec)
      throw new NotFoundException({
        data: {},
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });

    const data = {
      score: usedScoreRec.score,
      accountNumber: usedScoreRec.usedScore.accountNumber,
      nationalCode: usedScoreRec.usedScore.nationalCode,
      referenceCode: usedScoreRec.referenceCode,
      createdAt: moment(usedScoreRec.updatedAt).format('jYYYY/jMM/jDD'),
      status: usedScoreRec.status,
    };
    return {
      data,
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }

  async acceptUsedScore(referenceCode: number) {
    const usedScoreRec = await this.UsedScoreRepository.findOne({
      where: {
        referenceCode,
      },
    });

    if (!usedScoreRec || usedScoreRec.branchCode)
      throw new NotFoundException({
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });

    if (usedScoreRec.status)
      throw new BadRequestException({
        message: ErrorMessages.VALIDATE_INFO_FAILED,
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
      });
    usedScoreRec.status = true;
    usedScoreRec.updatedAt = new Date();
    try {
      await this.UsedScoreRepository.save(usedScoreRec);
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'score.service',
          method: 'acceptUsedScore',
          message: `API Accepted usedScore`,
          requestBody: JSON.stringify({ referenceCode, usedScoreRec }),
          stack: '',
        }),
      );
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'score.service',
        'acceptUsedScore',
        { referenceCode },
      );
    }
    return {
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }

  async cancleUsedScore(referenceCode: number) {
    const usedScoreRec = await this.UsedScoreRepository.findOne({
      where: {
        referenceCode: referenceCode,
      },
    });

    if (!usedScoreRec || usedScoreRec.branchCode || usedScoreRec.status)
      throw new NotFoundException({
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });
    try {
      await this.UsedScoreRepository.delete(usedScoreRec.id);
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'score.service',
          method: 'cancleUsedScore',
          message: `Api deleted a usedScore `,
          requestBody: JSON.stringify({ referenceCode, usedScoreRec }),
          stack: '',
        }),
      );
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'score.service',
        'cancleUsedScore',
        {
          referenceCode,
        },
      );
    }
    return {
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }
}
