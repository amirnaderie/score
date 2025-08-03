import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  RequestTimeoutException,
  Req,
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
import { CreateUseScoreDto } from '../dto/create-use-score.dto';
import { BankCoreProvider } from './coreBank.provider';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/interfaces/user.interface';
import { AuthService } from 'src/modules/auth/provider/auth.service';
const moment = require('moment-jalaali');

@Injectable()
export class ScoreService {
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
  ) {}

  public async findByNationalCodeForFront(nationalCode: number) {
    let scoresOfNationalCode: Partial<Score>[] | null;
    let scoresRec: any[] = [];

    try {
      scoresOfNationalCode = await this.scoreRepository.find({
        where: {
          nationalCode: nationalCode,
        },
        order: {
          accountNumber: 'ASC', // or 'DESC' for descending order
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
        return {
          data: [],
          message: ErrorMessages.NOT_FOUND,
          statusCode: 404,
          error: 'Not Found',
        };
        // throw new NotFoundException(ErrorMessages.NOT_FOUND);
      }
      for (const score of scoresOfNationalCode) {
        const scoreRec = await this.scoreRepository.query(
          'exec getScores @nationalCode=@0,@accountNumber=@1',
          [score.nationalCode, score.accountNumber],
        );
        const usedScore = await this.UsedScoreRepository.find({
          where: {
            usedScore: { id: scoreRec[0].id },
          },
          order: {
            id: 'ASC', // or 'DESC' for descending order
          },
        });
        scoresRec.push({
          scoreId: score.id,
          accountNumber: score.accountNumber,
          usableScore: scoreRec[0].usableScore,
          transferableScore: scoreRec[0].transferableScore,
          depositType: '1206',
          updatedAt: moment(score.updatedAt).format('jYYYY/jMM/jDD'),
          usedScore: usedScore.map((usedItem: UsedScore) => {
            return {
              id: usedItem.id,
              score: usedItem.score,
              createdAt: moment(usedItem.createdAt).format('jYYYY/jMM/jDD'),
              updatedAt: moment(usedItem.updatedAt).format('jYYYY/jMM/jDD'),
              personaCode: usedItem.personalCode,
              status: usedItem.status,
              personalCode: usedItem.personalCode,
              branchCode: usedItem.branchCode,
              branchName: usedItem.branchName,
            };
          }),
        });
      }
      let fullName: string = '';
      try {
        const fullNameRet =
          await this.bankCoreProvider.getCustomerBriefDetail(nationalCode);
        fullName = fullNameRet.name;
      } catch (error) {}
      return {
        data: {
          scoresRec,
          ownerName: fullName,
        },
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
        return {
          data: [],
          message: ErrorMessages.NOT_FOUND,
          statusCode: 404,
          error: 'Not Found',
        };
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
        return {
          message: ErrorMessages.OVERFLOW_MAX_TRANSFERABLE_SCORE,
          statusCode: 400,
          error: 'Bad Request',
        };
      }

      if (
        fromNationalCode === toNationalCode ||
        fromAccountNumber === toAccountNumber
      ) {
        return {
          message: ErrorMessages.VALIDATE_INFO_FAILED,
          statusCode: 400,
          error: 'Bad Request',
        };
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
          return {
            message: ErrorMessages.NOTACTIVE,
            statusCode: 400,
            error: 'Bad Redquest ',
          };
        }
      } catch (error) {}

      if (referenceCode) {
        const foundReferenceCode = await this.TransferScoreRepository.findOne({
          where: {
            referenceCode,
          },
        });
        if (foundReferenceCode)
          return {
            message: ErrorMessages.REPETITIVE_INFO_FAILED,
            statusCode: 409,
            error: 'Conflict ',
          };
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
            message: 'ُThere is no record for given fromNationalCode',
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
        return {
          message: ErrorMessages.SENDER_NOT_FOUND,
          statusCode: 404,
          error: 'Not Found',
        };
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
        return {
          message: ErrorMessages.INSUFFICIENT_SCORE,
          statusCode: 402,
          error: 'INSUFFICIENT SCORE',
        };
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
            message: 'ُThere is no record for given toNationalCode',
            requestBody: JSON.stringify({
              fromNationalCode,
              toNationalCode,
              score,
            }),
            stack: '',
          }),
        );
        return {
          message: ErrorMessages.RECIEVER_NOT_FOUND,
          statusCode: 404,
          error: 'Not Found',
        };
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
    let scoreRec: Partial<ScoreInterface>[] | null;

    if (referenceCode) {
      const foundReferenceCode = await this.UsedScoreRepository.findOne({
        where: {
          referenceCode,
        },
      });
      if (foundReferenceCode)
        return {
          message: ErrorMessages.REPETITIVE_INFO_FAILED,
          statusCode: 409,
          error: 'Conflict',
        };
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

        return {
          message: ErrorMessages.NOTACTIVE,
          statusCode: 400,
          error: 'Bad Redquest ',
        };
      }
    } catch (error) {}

    scoreRec = await this.scoreRepository.query(
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
          message: 'ُThere is no record for given nationalCode',
          requestBody: JSON.stringify({
            nationalCode,
            accountNumber,
            score,
          }),
          stack: '',
        }),
      );
      //throw new NotFoundException(ErrorMessages.NOT_FOUND);
      return {
        message: ErrorMessages.NOT_FOUND,
        statusCode: 404,
        error: 'Not Found',
      };
    }
    return this.consumeScore(scoreRec, score, 0, referenceCode);
  }

  async consumeScore(
    scoreRec: Partial<ScoreInterface>[] | null,
    score: number,
    persoanleCode: number,
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
              persoanleCode,
              referenceCode,
            }),
            stack: '',
          }),
        );
        return {
          message: ErrorMessages.INSUFFICIENT_SCORE,
          statusCode: 402,
          error: 'INSUFFICIENT SCORE',
        };
        //throw new BadRequestException(ErrorMessages.INSUFFICIENT_SCORE);
      }
      let personnelData: any = null;

      if (persoanleCode)
        personnelData = await this.authService.getPersonnelData(persoanleCode);

      const UseScore = this.UsedScoreRepository.create({
        usedScore: { id: scoreRec[0].id },
        score: score,
        personalCode: persoanleCode ? Number(persoanleCode) : null,
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
  /**
   * create a new score
   */
  public async usedScoreForFront(
    createUseScoreDto: CreateUseScoreDto,
    user: User,
    ip: string,
  ) {
    let scoreRec: Partial<ScoreInterface>[] | null;
    scoreRec = await this.scoreRepository.findBy({
      id: createUseScoreDto.scoreId,
    });

    if (!scoreRec || scoreRec.length === 0 || !scoreRec[0]?.id) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'score.service',
          method: 'consumeScore',
          message: 'ُThere is no record for given nationalCode',
          requestBody: JSON.stringify({
            scoreId: createUseScoreDto.scoreId,
            user,
            ip,
          }),
          stack: '',
        }),
      );
      //throw new NotFoundException(ErrorMessages.NOT_FOUND);
      return {
        message: ErrorMessages.NOT_FOUND,
        statusCode: 404,
        error: 'Not Found',
      };
    }
    const scoreRow = await this.scoreRepository.query(
      'exec getScores @nationalCode=@0,@accountNumber=@1',
      [scoreRec[0].nationalCode, scoreRec[0].accountNumber],
    );

    return this.consumeScore(
      scoreRow,
      createUseScoreDto.score,
      Number(user.userName),
      null,
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
      return {
        message: ErrorMessages.NOT_FOUND,
        statusCode: 404,
        error: 'Not Found',
      };
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
      return {
        message: ErrorMessages.NOT_FOUND,
        statusCode: 404,
        error: 'Not Found',
      };
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
      return {
        data: {},
        message: ErrorMessages.NOT_FOUND,
        statusCode: 404,
        error: 'Not Found',
      };

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
      return {
        data: {},
        message: ErrorMessages.NOT_FOUND,
        statusCode: 404,
        error: 'Not Found',
      };

    const data = {
      score: usedScoreRec.score,
      accountNumber: usedScoreRec.usedScore.accountNumber,
      nationalCode: usedScoreRec.usedScore.nationalCode,
      referenceCode: usedScoreRec.referenceCode,
      createdAt: moment(usedScoreRec.createdAt).format('jYYYY/jMM/jDD'),
    };
    return {
      data,
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }
  async acceptUsedScoreFront(usedScoreId: number, user: User) {
    const usedScoreRec = await this.UsedScoreRepository.findOne({
      where: {
        id: usedScoreId,
      },
      //relations: ['usedScore'],
    });
    const userData: Partial<User> = await this.authService.getPersonnelData(
      Number(user.userName),
    );
    if (
      !usedScoreRec ||
      usedScoreRec.branchCode !== Number(userData.branchCode)
    )
      return {
        data: {},
        message: ErrorMessages.NOT_FOUND,
        statusCode: 404,
        error: 'Not Found',
      };
    usedScoreRec.status = true;
    try {
      await this.UsedScoreRepository.save(usedScoreRec);
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'score.service',
        'acceptUsedScoreFront',
        { usedScoreId, personalCode: userData.branchCode },
      );
      throw new InternalServerErrorException(ErrorMessages.INTERNAL_ERROR);
    }
    return {
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }
  async cancleUsedScoreFront(usedScoreId: number, user: User) {
    const usedScoreRec = await this.UsedScoreRepository.findOne({
      where: {
        id: usedScoreId,
      },
      //relations: ['usedScore'],
    });
    const userData: Partial<User> = await this.authService.getPersonnelData(
      Number(user.userName),
    );
    if (
      !usedScoreRec ||
      usedScoreRec.branchCode !== Number(userData.branchCode)
    )
      return {
        data: {},
        message: ErrorMessages.NOT_FOUND,
        statusCode: 404,
        error: 'Not Found',
      };
    try {
      await this.UsedScoreRepository.delete(usedScoreRec.id);
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'score.service',
          method: 'cancleUsedScoreFront',
          message: `personalCode:${userData.personalCode} branchCode:${user.branchCode} deleted a usedScore `,
          requestBody: JSON.stringify(usedScoreRec),
          stack: '',
        }),
      );
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'score.service',
        'cancleUsedScoreFront',
        {
          usedScoreId,
          personalCode: user.personalCode,
          branchCode: user.branchCode,
        },
      );
      throw new InternalServerErrorException(ErrorMessages.INTERNAL_ERROR);
    }
    return {
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }
}
