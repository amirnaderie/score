import {
  BadRequestException,
  Injectable,
  NotFoundException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { Score } from '../entities/score.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { logTypes } from '../../log/enums/logType.enum';
import { ErrorMessages } from '../../../constants/error-messages.constants';
import handelError from '../../../utility/handel-error';
import { TransferScore } from '../entities/transfer-score.entity';
import { UsedScore } from '../entities/used-score.entity';
import { ScoreInterface } from '../interfaces/score.interface';
import { BankCoreProvider } from './coreBank.provider';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/modules/auth/provider/auth.service';
import { SharedProvider } from './shared.provider';
import { LogEvent } from 'src/modules/event/providers/log.event';
import { UtilityService } from 'src/utility/utility.service'; // Import UtilityService
const moment = require('moment-jalaali');

@Injectable()
export class ApiScoreService {
  constructor(
    private eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
    @InjectRepository(Score)
    private readonly scoreRepository: Repository<Score>,
    @InjectRepository(TransferScore)
    private readonly transferScoreRepository: Repository<TransferScore>,
    @InjectRepository(UsedScore)
    private readonly UsedScoreRepository: Repository<UsedScore>,
    private readonly bankCoreProvider: BankCoreProvider,
    private readonly configService: ConfigService,
    private readonly sharedProvider: SharedProvider,
    private readonly utilityService: UtilityService, // Inject UtilityService
  ) { }

  public async findByNationalCode(nationalCode: number) {
    let scoresOfNationalCode: any[] | null;
    const scoresRec: any[] = [];

    try {
      scoresOfNationalCode =
        await this.sharedProvider.getScoresRowsBynationalCode(nationalCode);

      if (!scoresOfNationalCode || scoresOfNationalCode.length === 0) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'api-score.service',
            method: 'findByNationalCode',
            message: `There is no record for this nationalCode:${nationalCode}`,
            requestBody: JSON.stringify({ nationalCode }),
            stack: '',
          }),
        );
        throw new NotFoundException({
          data: [],
          message: ErrorMessages.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
        });
      }
      for (const score of scoresOfNationalCode) {
        scoresRec.push({
          accountNumber: score.accountNumber,
          usableScore: Number(score.usableScore),
          transferableScore: Number(score.transferableScore),
          depositType: '1206',
          updatedAt: moment(score.updated_at).format('jYYYY/jMM/jDD'),
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
        'api-score.service',
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
    ip: string,
    referenceCode: number | null,
    description: string,
  ) {



    if (
      score > Number(this.configService.get<string>('MAX_TRANSFERABLE_SCORE'))
    ) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'api-score.service',
          method: 'transferScore',
          message: `transfer score overflow max transferable score maxTransferableScore:${this.configService.get<string>(
            'MAX_TRANSFERABLE_SCORE',
          )} fromNationalCode:${fromNationalCode} fromAccountNumber:${fromAccountNumber} toNationalCode:${toNationalCode}  toAccountNumber:${toAccountNumber} score:${score}`,
          requestBody: JSON.stringify({
            fromNationalCode,
            fromAccountNumber,
            score,
            MAX_TRANSFERABLE_SCORE: this.configService.get<string>(
              'MAX_TRANSFERABLE_SCORE',
            ),
            ip,
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
      fromNationalCode === toNationalCode &&
      fromAccountNumber === toAccountNumber
    ) {
      throw new BadRequestException({
        message: ErrorMessages.VALIDATE_INFO_FAILED,
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
      });
    }
    let accountFrom;
    let accountTo;
    const scoreFromOwner =
      await this.bankCoreProvider.getCustomerBriefDetail(fromNationalCode);
    accountFrom = await this.bankCoreProvider.getDepositDetail(scoreFromOwner.cif, [
      fromAccountNumber,
    ]);

    if (toNationalCode.toString().length < 11) {
      const scoreToOwner =
        await this.bankCoreProvider.getCustomerBriefDetail(toNationalCode);
      accountTo = await this.bankCoreProvider.getDepositDetail(scoreToOwner.cif, [
        toAccountNumber,
      ]);
    }

    if (accountFrom.depositType !== accountTo.depositType) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'api-score.service',
          method: 'transferScore',
          message: `depositType Of fromNationalCode:${fromNationalCode} fromAccountNumber:${fromAccountNumber} type:${accountFrom.depositType} and toNationalCode:${toNationalCode} toAccountNumber:${toAccountNumber} type:${accountTo.depositType} is not the same`,
          requestBody: JSON.stringify({
            fromNationalCode,
            toNationalCode,
            fromAccountNumber,
            toAccountNumber
          }),
          stack: '',
        }),
      );
      throw new BadRequestException({
        message: ErrorMessages.DIFERENT_DEPOSITTYPE,
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
      });
    }

    let fromBranchData: any
    let toBranchData: any
    try {
      fromBranchData = this.sharedProvider.getBranchData(this.utilityService.createBranchCode(accountFrom.branchCode));
    } catch (error) {
      throw new BadRequestException({
        message: ErrorMessages.AFRA_ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
      });
    }

    try {
      toBranchData = this.sharedProvider.getBranchData(this.utilityService.createBranchCode(accountTo.branchCode));
    } catch (error) {
      throw new BadRequestException({
        message: ErrorMessages.AFRA_ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
      });
    }
    if (!fromBranchData || !toBranchData || toBranchData.province.code !== fromBranchData.province.code) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'api-score.service',
          method: 'transferScore',
          message: `this branchCode:${accountFrom.branchCode} is not in same province with branchCode:${accountTo.branchCode}`,
          requestBody: JSON.stringify({
            fromAccountNumber,
            toAccountNumber,
            fromNationalCode,
            toNationalCode,
          }),
          stack: '',
        })
      )
      throw new BadRequestException({
        message: ErrorMessages.DIFERENT_PROVINCE,
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
      });
    }

    if (referenceCode) {
      const foundReferenceCode = await this.transferScoreRepository.findOne({
        where: {
          referenceCode,
        },
      });
      if (foundReferenceCode) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'api-score.service',
            method: 'transferScore',
            message: `this referenceCode:${referenceCode} is duplicate`,
            requestBody: JSON.stringify({
              fromAccountNumber,
              toAccountNumber,
            }),
            stack: '',
          }),
        );

        throw new ConflictException({
          message: ErrorMessages.REPETITIVE_INFO_FAILED,
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
        });
      }
    }

    return this.sharedProvider.transferScore(
      fromNationalCode,
      toNationalCode,
      fromAccountNumber,
      toAccountNumber,
      score,
      0,
      referenceCode,
      description,
    );

    // return { message: ErrorMessages.SUCCESSFULL, statusCode: 200 };

  }

  public async usedScore(
    nationalCode: number,
    accountNumber: number,
    score: number,
    referenceCode: number | null,
    description: string,
  ) {
    if (referenceCode) {
      const foundReferenceCode = await this.UsedScoreRepository.findOne({
        where: {
          referenceCode,
        },
      });
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'api-score.service',
          method: 'usedScore',
          message: `The referenceCode:${referenceCode} is duplicate`,
          requestBody: JSON.stringify({
            nationalCode,
            accountNumber,
            score,
          }),
          stack: '',
        }),
      );
      if (foundReferenceCode)
        throw new ConflictException({
          message: ErrorMessages.REPETITIVE_INFO_FAILED,
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
        });
    }

    const scoreOwner =
      await this.bankCoreProvider.getCustomerBriefDetail(nationalCode);
    await this.bankCoreProvider.getDepositDetail(scoreOwner.cif, [
      accountNumber,
    ]);

    // const scoreRec: ScoreInterface =
    //   await this.scoreRepository.query(
    //     'exec getScores @nationalCode=@0,@accountNumber=@1',
    //     [nationalCode, accountNumber],
    //   );
    // const scoreRec = await this.sharedProvider.getScore(accountNumber, nationalCode)

    // if (!scoreRec || scoreRec.length === 0) {
    //   this.eventEmitter.emit(
    //     'logEvent',
    //     new LogEvent({
    //       logTypes: logTypes.INFO,
    //       fileName: 'score.service',
    //       method: 'usedScore',
    //       message:
    //         `There is no record in Scores for nationalCode:${nationalCode} and accountNumber:${accountNumber}`,
    //       requestBody: JSON.stringify({
    //         nationalCode,
    //         accountNumber,
    //         score,
    //       }),
    //       stack: '',
    //     }),
    //   );
    //   //throw new NotFoundException(ErrorMessages.NOT_FOUND);
    //   throw new NotFoundException({
    //     message: ErrorMessages.NOT_FOUND,
    //     statusCode: HttpStatus.NOT_FOUND,
    //     error: 'Not Found',
    //   });
    // }

    return this.sharedProvider.useScore(
      nationalCode,
      accountNumber,
      score,
      0,
      referenceCode,
      description,
    );
  }

  async getTransferScore(nationalCode: number) {
    const where: any = {};
    if (nationalCode) {
      where.nationalCode = nationalCode;
    }

    const coresRec =
      Object.keys(where).length > 0
        ? await this.scoreRepository.find({ where })
        : await this.scoreRepository.find();

    if (!coresRec) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'api-score.service',
          method: 'getTransferScore',
          message: `The nationalCode:${nationalCode}  is not found`,
          requestBody: JSON.stringify({
            nationalCode,
          }),
          stack: '',
        }),
      );

      throw new NotFoundException({
        data: [],
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });
    }
    const TransferScoreFromRecs = await this.transferScoreRepository.find({
      where: {
        fromScore: { id: In(coresRec.map((c) => c.id)) },
      },
      relations: ['fromScore', 'toScore'],
    });

    const dataFrom = TransferScoreFromRecs.map((ts) => ({
      score: ts.score,
      fromAccountNumber: ts.fromScore.accountNumber,
      fromNationalCode: ts.fromScore.nationalCode,
      toAccountNumber: ts.toScore.accountNumber,
      toNationalCode: ts.toScore.nationalCode,
      referenceCode: ts.referenceCode,
      createdAt: moment(ts.createdAt).format('jYYYY/jMM/jDD'),
      reversedAt:
        ts.reversedAt && moment(ts.reversedAt).format('jYYYY/jMM/jDD'),
    }));

    const TransferScoreToRecs = await this.transferScoreRepository.find({
      where: {
        toScore: { id: In(coresRec.map((c) => c.id)) },
      },
      relations: ['fromScore', 'toScore'],
    });

    const dataTo = TransferScoreToRecs.map((ts) => ({
      score: ts.score,
      fromAccountNumber: ts.fromScore.accountNumber,
      fromNationalCode: ts.fromScore.nationalCode,
      toAccountNumber: ts.toScore.accountNumber,
      toNationalCode: ts.toScore.nationalCode,
      referenceCode: ts.referenceCode,
      createdAt: moment(ts.createdAt).format('jYYYY/jMM/jDD'),
      reversedAt:
        ts.reversedAt && moment(ts.reversedAt).format('jYYYY/jMM/jDD'),
    }));
    return {
      data: [...dataFrom, ...dataTo],
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }
  async getTransferScoreFrom(
    fromNationalCode: number,
    fromAccountNumber: number,
  ) {
    const where: any = {};
    if (fromNationalCode) {
      where.nationalCode = fromNationalCode;
    }
    if (fromAccountNumber) {
      where.accountNumber = fromAccountNumber;
    }
    const coresRec =
      Object.keys(where).length > 0
        ? await this.scoreRepository.find({ where })
        : await this.scoreRepository.find();

    // const coresRec = await this.scoreRepository.find({
    //   where: {
    //     nationalCode: fromNationalCode,
    //     accountNumber: fromAccountNumber,
    //   },
    // });
    if (!coresRec) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'api-score.service',
          method: 'getTransferScoreFrom',
          message: `The nationalCode:${fromNationalCode} accountNumber:${fromAccountNumber} is not found`,
          requestBody: JSON.stringify({
            fromNationalCode,
            fromAccountNumber,
          }),
          stack: '',
        }),
      );

      throw new NotFoundException({
        data: [],
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });
    }
    const TransferScoreRec = await this.transferScoreRepository.find({
      where: {
        fromScore: { id: In(coresRec.map((c) => c.id)) },
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
      reversedAt:
        ts.reversedAt && moment(ts.reversedAt).format('jYYYY/jMM/jDD'),
    }));
    return {
      data,
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }

  async getTransferScoreTo(toNationalCode: number, toAccountNumber: number) {
    // Build where condition dynamically
    const where: any = {};
    if (toNationalCode) {
      where.nationalCode = toNationalCode;
    }
    if (toAccountNumber) {
      where.accountNumber = toAccountNumber;
    }
    const coresRec =
      Object.keys(where).length > 0
        ? await this.scoreRepository.find({ where })
        : await this.scoreRepository.find();
    if (!coresRec) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'api-score.service',
          method: 'getTransferScoreTo',
          message: `The nationalCode:${toNationalCode} accountNumber:${toAccountNumber} is not found`,
          requestBody: JSON.stringify({
            toNationalCode,
            toAccountNumber,
          }),
          stack: '',
        }),
      );
      throw new NotFoundException({
        data: [],
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });
    }
    const TransferScoreRec = await this.transferScoreRepository.find({
      where: {
        toScore: { id: In(coresRec.map((c) => c.id)) },
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
      reversedAt:
        ts.reversedAt && moment(ts.reversedAt).format('jYYYY/jMM/jDD'),
    }));
    return {
      data,
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }

  async getTransferByReferenceCode(referenceCode: number) {
    const TransferScoreRec = await this.transferScoreRepository.find({
      where: {
        referenceCode,
      },
      relations: ['fromScore', 'toScore'],
    });
    if (!TransferScoreRec && TransferScoreRec.length === 0)
      throw new NotFoundException({
        data: {},
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });

    const totalScore = TransferScoreRec.reduce(
      (sum, item) => sum + Number(item.score),
      0,
    );

    const data = {
      score: totalScore,
      fromAccountNumber: TransferScoreRec[0].fromScore.accountNumber,
      fromNationalCode: TransferScoreRec[0].fromScore.nationalCode,
      toAccountNumber: TransferScoreRec[0].toScore.accountNumber,
      toNationalCode: TransferScoreRec[0].toScore.nationalCode,
      referenceCode: TransferScoreRec[0].referenceCode,
      createdAt: moment(TransferScoreRec[0].createdAt).format('jYYYY/jMM/jDD'),
    };
    return {
      data,
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }
  async getUsedScoreByNationalCode(nationalCode: number) {
    // Query UsedScore rows where related Score.nationalCode matches
    const usedScoreRec = await this.UsedScoreRepository
      .createQueryBuilder('usedScore')
      .leftJoinAndSelect('usedScore.usedScore', 'score')
      .where('score.nationalCode = :nationalCode', { nationalCode })
      .getMany();

    if (!usedScoreRec || usedScoreRec.length === 0)
      throw new NotFoundException({
        data: [],
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });

    const data = usedScoreRec.map((item) => ({
      accountNumber: item.usedScore?.accountNumber,
      nationalCode: item.usedScore?.nationalCode,
      score: item.score,
      referenceCode: item.referenceCode,
      createdAt: item.createdAt ? moment(item.createdAt).format('jYYYY/jMM/jDD') : null,
      updatedAt: item.updatedAt ? moment(item.updatedAt).format('jYYYY/jMM/jDD') : null,
      status: item.status,
    }));

    return {
      data,
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }
  async getUsedScoreByReferenceCode(referenceCode: number) {
    const usedScoreRec = await this.UsedScoreRepository.find({
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
    const totalScore = usedScoreRec.reduce(
      (sum, item) => sum + Number(item.score),
      0,
    );

    const data = {
      score: totalScore,
      accountNumber: usedScoreRec[0].usedScore.accountNumber,
      nationalCode: usedScoreRec[0].usedScore.nationalCode,
      referenceCode: usedScoreRec[0].referenceCode,
      createdAt: moment(usedScoreRec[0].updatedAt).format('jYYYY/jMM/jDD'),
      status: usedScoreRec[0].status,
    };
    return {
      data,
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }

  async acceptUsedScore(referenceCode: number) {
    const usedScoreRec = await this.UsedScoreRepository.find({
      where: {
        referenceCode,
      },
    });

    if (!usedScoreRec || usedScoreRec.length === 0)
      throw new NotFoundException({
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });

    if (usedScoreRec[0].status)
      throw new BadRequestException({
        message: ErrorMessages.VALIDATE_INFO_FAILED,
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
      });
    for (let index = 0; index < usedScoreRec.length; index++) {
      usedScoreRec[index].status = true;
      usedScoreRec[index].updatedAt = new Date();
    }
    try {
      await this.UsedScoreRepository.save(usedScoreRec);
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'api-score.service',
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
        'api-score.service',
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
    const usedScoreRec = await this.UsedScoreRepository.find({
      where: {
        referenceCode: referenceCode,
      },
    });

    if (!usedScoreRec || usedScoreRec.length === 0)
      throw new NotFoundException({
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });

    if (usedScoreRec[0].status)
      throw new NotFoundException({
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });

    try {
      await this.UsedScoreRepository.remove(usedScoreRec);
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'api-score.service',
          method: 'cancleUsedScore',
          message: `Api deleted a usedScore with referenceCode: ${referenceCode}`,
          requestBody: JSON.stringify({ referenceCode, usedScoreRec }),
          stack: '',
        }),
      );
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'api-score.service',
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

  public async reverseTransfer(referenceCode: number, reverseScore: number) {
    return this.sharedProvider.reverseTransfer(referenceCode, reverseScore);
  }
}