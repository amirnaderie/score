import {
  Injectable,
  NotFoundException,
  HttpStatus,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Score } from '../entities/score.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { logTypes } from '../../log/enums/logType.enum';
import { ErrorMessages } from '../../../constants/error-messages.constants';
import handelError from '../../../utility/handel-error';
import { UsedScore } from '../entities/used-score.entity';
import { CreateUseScoreDto } from '../dto/create-use-score.dto';
import { BankCoreProvider } from './coreBank.provider';
import { User } from 'src/interfaces/user.interface';
import { AuthService } from 'src/modules/auth/provider/auth.service';
import { SharedProvider } from './shared.provider';
import { LogEvent } from 'src/modules/event/providers/log.event';
import { ConfigService } from '@nestjs/config';
import {
  PaginatedTransferResponseDto,
  TransferResponseDto,
} from '../dto/paginated-transfer.dto';
import { TransferScore } from '../entities/transfer-score.entity';
const moment = require('moment-jalaali');
import { UsedScoreDescription } from '../entities/used-score-description.entity';
import { UpdateScoreDto } from '../dto/update-score.dto';
import { CreateScoreDto } from '../dto/create-score.dto';
import {
  FacilitiesInProgressDto,
  FacilityInProgressResponseDto,
} from '../dto/facilities-in-progress.dto';

@Injectable()
export class FrontScoreService {
  constructor(
    private eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
    @InjectRepository(Score)
    private readonly scoreRepository: Repository<Score>,
    @InjectRepository(UsedScore)
    private readonly usedScoreRepository: Repository<UsedScore>,
    @InjectRepository(TransferScore)
    private readonly transferScoreRepository: Repository<TransferScore>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly bankCoreProvider: BankCoreProvider,
    private readonly sharedProvider: SharedProvider,
  ) { }

  public async findByNationalCodeForFront(nationalCode: number) {
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
            fileName: 'front-score.service',
            method: 'findByNationalCodeForFront',
            message: `There is no record for the nationalCode: ${nationalCode}`,
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
        const scoreRecs = await this.sharedProvider.getValidScores(
          score.accountNumber,
          nationalCode,
        );
        let usedScore: any[] = [];
        if (scoreRecs && scoreRecs.length > 0) {
          const scoreIds = scoreRecs.map((rec) => rec.id);

          const usedRecs = await this.usedScoreRepository
            .createQueryBuilder('usedScore')
            .leftJoin(
              UsedScoreDescription,
              'usd',
              'usd.referenceCode = usedScore.referenceCode',
            )
            .select([
              'usedScore.referenceCode as referenceCode',
              'SUM(usedScore.score) as score',
              'MAX(usedScore.createdAt) as createdAt',
              'MAX(usedScore.updatedAt) as updatedAt',
              'MAX(usedScore.personalCode) as personalCode',
              'CAST(MIN(CAST(usedScore.status as INT)) as BIT) as status',
              'MAX(usedScore.branchCode) as branchCode',
              'usd.description as description',
            ])
            .where('usedScore.scoreId IN (:...scoreIds)', { scoreIds })
            .groupBy('usedScore.referenceCode, usd.description')
            .orderBy('MIN(usedScore.createdAt)', 'ASC')
            .getRawMany();

          if (usedRecs && usedRecs.length > 0) {
            usedRecs.map((usedItem: any) => {
              usedScore.push({
                referenceCode: usedItem.referenceCode,
                score: usedItem.score,
                createdAt: moment(usedItem.createdAt).format('jYYYY/jMM/jDD'),
                updatedAt: moment(usedItem.updatedAt).format('jYYYY/jMM/jDD'),
                status: usedItem.status,
                personalCode: usedItem.personalCode,
                branchCode: usedItem.branchCode,
                branchName: usedItem.branchName,
                description: usedItem.description,
              });
            });
          }
          // }
        }
        scoresRec.push({
          accountNumber: score.accountNumber,
          usableScore: score.usableScore,
          transferableScore: score.transferableScore,
          depositType: '1206',
          updatedAt: moment(score.updated_at).format('jYYYY/jMM/jDD'),
          usedScore: usedScore,
        });
      }
      let fullName: string = '';
      try {
        const fullNameRet =
          await this.bankCoreProvider.getCustomerBriefDetail(nationalCode);
        fullName = fullNameRet.name;
      } catch { }
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
        'front-score.service',
        'findByNationalCodeForFront',
        { nationalCode: nationalCode },
      );
    }
  }

  public async estelamTransferScore(
    fromNationalCode: number,
    toNationalCode: number,
    fromAccountNumber: number,
    toAccountNumber: number,
  ) {
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
    let scoreFromOwner;
    try {
      scoreFromOwner =
        await this.bankCoreProvider.getCustomerBriefDetail(fromNationalCode);
      await this.bankCoreProvider.getDepositDetail(scoreFromOwner.cif, [
        fromAccountNumber,
      ]);
    } catch (error) {
      if (error.status === 404) {
        handelError(
          error,
          this.eventEmitter,
          'front-score.service',
          'estelamTransferScore',
          {
            fromNationalCode,
            toNationalCode,
          },
        );
        throw new BadRequestException({
          message: error.message,
          statusCode: error.name,
          error: error.name,
        });
      }
    }
    try {
      const scoreToOwner =
        await this.bankCoreProvider.getCustomerBriefDetail(toNationalCode);
      await this.bankCoreProvider.getDepositDetail(scoreToOwner.cif, [
        toAccountNumber,
      ]);

      return {
        message: ErrorMessages.SUCCESSFULL,
        statusCode: 200,
        data: {
          fromName: scoreFromOwner.name || '',
          toName: scoreToOwner.name || '',
        },
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'estelamTransferScore',
        {
          fromNationalCode,
          toNationalCode,
        },
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
    user: User,
  ) {
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

    let scoreFromOwner;
    try {
      scoreFromOwner =
        await this.bankCoreProvider.getCustomerBriefDetail(fromNationalCode);
      await this.bankCoreProvider.getDepositDetail(scoreFromOwner.cif, [
        fromAccountNumber,
      ]);
    } catch (error) {
      if (error.status === 404) {
        handelError(
          error,
          this.eventEmitter,
          'front-score.service',
          'estelamTransferScore',
          {
            fromNationalCode,
            toNationalCode,
          },
        );
        throw new BadRequestException({
          message: error.message,
          statusCode: error.name,
          error: error.name,
        });
      }
    }

    if (toNationalCode.toString().length < 11) {
      const scoreToOwner =
        await this.bankCoreProvider.getCustomerBriefDetail(toNationalCode);
      await this.bankCoreProvider.getDepositDetail(scoreToOwner.cif, [
        toAccountNumber,
      ]);
    }

    try {
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
              fileName: 'front-score.service',
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
        Number(user.userName),
        null,
        description,
        true,
      );

      // return { message: ErrorMessages.SUCCESSFULL, statusCode: 200 };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'transferScore',
        {
          fromNationalCode,
          toNationalCode,
          score,
        },
      );
    }
  }

  public async usedScoreForFront(
    createUseScoreDto: CreateUseScoreDto,
    user: User,
  ) {
    // const scoreRec = await this.scoreRepository.findBy({
    //   id: createUseScoreDto.scoreId,
    // });

    // const scoreRec = await this.sharedProvider.getScore(Number(createUseScoreDto.accountNumber), Number(createUseScoreDto.nationalCode))

    // if (!scoreRec || scoreRec.length === 0) {
    //   this.eventEmitter.emit(
    //     'logEvent',
    //     new LogEvent({
    //       logTypes: logTypes.INFO,
    //       fileName: 'front-score.service',
    //       method: 'usedScoreForFront',
    //       message: `There is no record for nationalCode:${createUseScoreDto.nationalCode} and accountNumber:${createUseScoreDto.accountNumber}`,
    //       requestBody: JSON.stringify({
    //         CreateUseScoreDto,
    //         user
    //       }),
    //       stack: '',
    //     }),
    //   );
    //   throw new NotFoundException({
    //     data: [],
    //     message: ErrorMessages.NOT_FOUND,
    //     statusCode: HttpStatus.NOT_FOUND,
    //     error: 'Not Found',
    //   });
    // }
    // const scoreRow = await this.scoreRepository.query(
    //   'exec getScores @nationalCode=@0,@accountNumber=@1',
    //   [scoreRec[0].nationalCode, scoreRec[0].accountNumber],
    // );

    return this.sharedProvider.consumeScore(
      Number(createUseScoreDto.nationalCode),
      Number(createUseScoreDto.accountNumber),
      createUseScoreDto.score,
      Number(user.userName),
      null,
      createUseScoreDto.description,
    );
  }

  async acceptUsedScoreFront(referenceCode: number, user: User) {
    const usedScoreRec = await this.usedScoreRepository.find({
      where: {
        referenceCode,
      },
    });
    const userData: Partial<User> = await this.authService.getPersonalData(
      Number(user.userName),
    );
    if (
      !usedScoreRec ||
      usedScoreRec.length === 0 ||
      usedScoreRec[0].branchCode !== Number(userData.branchCode)
    ) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'acceptUsedScore',
          message: `There is no record for personalCode:${user.userName} branchCode:${userData.branchCode} in afra`,
          requestBody: JSON.stringify({ referenceCode, user }),
          stack: JSON.stringify(userData),
        }),
      );
      throw new NotFoundException({
        data: [],
        message: ErrorMessages.USER_NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });
    }
    for (let index = 0; index < usedScoreRec.length; index++) {
      usedScoreRec[index].status = true;
      usedScoreRec[index].updatedAt = new Date();
    }
    try {
      await this.usedScoreRepository.save(usedScoreRec);
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'acceptUsedScore',
          message: `Accept use for referenceCode:${referenceCode} personalCode:${user.userName} branchCode:${userData.branchCode}  `,
          requestBody: JSON.stringify({ referenceCode, user }),
          stack: '',
        }),
      );
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'acceptUsedScoreFront',
        { referenceCode, personalCode: userData.branchCode },
      );
    }
    return {
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }

  async cancleUsedScoreFront(referenceCode: number, user: User) {
    const usedScoreRec = await this.usedScoreRepository.find({
      where: {
        referenceCode,
      },
    });
    const userData: Partial<User> = await this.authService.getPersonalData(
      Number(user.userName),
    );
    if (
      !usedScoreRec ||
      usedScoreRec.length === 0 ||
      usedScoreRec[0].branchCode !== Number(userData.branchCode)
    )
      throw new NotFoundException({
        data: {},
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });
    try {
      await this.usedScoreRepository.remove(usedScoreRec);
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'cancleUsedScoreFront',
          message: `cancel use for referenceCode:${referenceCode} personalCode:${user.userName} branchCode:${userData.branchCode} `,
          requestBody: JSON.stringify({ referenceCode, user }),
          stack: '',
        }),
      );
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'cancleUsedScoreFront',
        {
          referenceCode,
          personalCode: user.personalCode,
          branchCode: user.branchCode,
        },
      );
    }
    return {
      message: ErrorMessages.SUCCESSFULL,
      statusCode: 200,
    };
  }

  public async getAllTransfersPaginated(
    nationalCode: number,
    accountNumber: number,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'date',
    sortOrder: string = 'DESC',
  ): Promise<PaginatedTransferResponseDto> {
    try {
      // Create query builder for transfers FROM this account
      const fromQuery = this.transferScoreRepository
        .createQueryBuilder('transfer')
        .leftJoinAndSelect('transfer.fromScore', 'fromScore')
        .leftJoinAndSelect('transfer.toScore', 'toScore')
        .leftJoin(
          'TransferScoreDescriptions',
          'desc',
          'desc.referenceCode = transfer.referenceCode',
        )
        .addSelect('desc.description', 'description')
        .where('fromScore.nationalCode = :nationalCode', { nationalCode })
        .andWhere('fromScore.accountNumber = :accountNumber', {
          accountNumber,
        });

      // Create query builder for transfers TO this account
      const toQuery = this.transferScoreRepository
        .createQueryBuilder('transfer')
        .leftJoinAndSelect('transfer.fromScore', 'fromScore')
        .leftJoinAndSelect('transfer.toScore', 'toScore')
        .leftJoin(
          'TransferScoreDescriptions',
          'desc',
          'desc.referenceCode = transfer.referenceCode',
        )
        .addSelect('desc.description', 'description')
        .where('toScore.nationalCode = :nationalCode', { nationalCode })
        .andWhere('toScore.accountNumber = :accountNumber', { accountNumber });

      // Get all results (without pagination first to group properly)
      const [fromTransfers, toTransfers] = await Promise.all([
        fromQuery.orderBy('transfer.createdAt', 'ASC').getRawAndEntities(),
        toQuery.orderBy('transfer.createdAt', 'ASC').getRawAndEntities(),
      ]);

      // Combine and format all results
      const allTransfers: TransferResponseDto[] = [
        ...fromTransfers.entities.map((transfer, index) => ({
          referenceCode: transfer.referenceCode,
          fromNationalCode: transfer.fromScore.nationalCode,
          fromAccountNumber: transfer.fromScore.accountNumber,
          toNationalCode: transfer.toScore.nationalCode,
          toAccountNumber: transfer.toScore.accountNumber,
          score: transfer.score,
          transferDate: transfer.createdAt.toISOString(),
          transferDateShamsi: moment(transfer.createdAt).format(
            'jYYYY/jMM/jDD HH:mm:ss',
          ),
          direction: 'from' as const,
          reversedAt:
            transfer.reversedAt &&
            moment(transfer.reversedAt).format('jYYYY/jMM/jDD HH:mm:ss'),
          description: fromTransfers.raw[index]?.description || null,
        })),
        ...toTransfers.entities.map((transfer, index) => ({
          referenceCode: transfer.referenceCode,
          fromNationalCode: transfer.fromScore.nationalCode,
          fromAccountNumber: transfer.fromScore.accountNumber,
          toNationalCode: transfer.toScore.nationalCode,
          toAccountNumber: transfer.toScore.accountNumber,
          score: transfer.score,
          transferDate: transfer.createdAt.toISOString(),
          transferDateShamsi: moment(transfer.createdAt).format(
            'jYYYY/jMM/jDD HH:mm:ss',
          ),
          direction: 'to' as const,
          reversedAt:
            transfer.reversedAt &&
            moment(transfer.reversedAt).format('jYYYY/jMM/jDD HH:mm:ss'),
          description: toTransfers.raw[index]?.description || null,
        })),
      ];

      // Group by referenceCode and reversedAt, sum scores
      const groupedTransfers = new Map<string, TransferResponseDto>();

      allTransfers.forEach((transfer) => {
        // Create composite key: referenceCode + reversedAt (or 'null' if no reversedAt)
        const groupKey = `${transfer.referenceCode}_${transfer.reversedAt || 'null'}`;
        const existing = groupedTransfers.get(groupKey);
        if (existing) {
          // Sum the scores as numbers, keep other fields from the first item
          existing.score = Number(existing.score) + Number(transfer.score);
        } else {
          // First item with this composite key, ensure score is a number
          groupedTransfers.set(groupKey, {
            ...transfer,
            score: Number(transfer.score),
          });
        }
      });

      // Convert map to array
      const groupedTransfersArray = Array.from(groupedTransfers.values());

      // Sort grouped results
      groupedTransfersArray.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'date') {
          comparison =
            new Date(a.transferDate).getTime() -
            new Date(b.transferDate).getTime();
        } else if (sortBy === 'score') {
          comparison = a.score - b.score;
        }
        return sortOrder === 'ASC' ? comparison : -comparison;
      });

      // Apply pagination to grouped results
      const total = groupedTransfersArray.length;
      const skip = (page - 1) * limit;
      const paginatedTransfers = groupedTransfersArray.slice(
        skip,
        skip + limit,
      );

      return {
        data: paginatedTransfers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'getAllTransfersPaginated',
        {
          nationalCode,
          accountNumber,
          page,
          limit,
          sortBy,
          sortOrder,
        },
      );
    }
  }

  public async findScoreByNationalCodeAndAccountNumber(
    nationalCode: string,
    accountNumber: string,
  ) {
    try {
      // If accountNumber is provided, find all scores that match both nationalCode and accountNumber
      if (accountNumber) {
        const scores = await this.scoreRepository.find({
          where: {
            nationalCode: Number(nationalCode),
            accountNumber: Number(accountNumber),
          },
          order: {
            id: 'ASC',
          },
        });

        if (!scores || scores.length === 0) {
          this.eventEmitter.emit(
            'logEvent',
            new LogEvent({
              logTypes: logTypes.INFO,
              fileName: 'front-score.service',
              method: 'findScoreByNationalCodeAndAccountNumber',
              message: `No scores found for nationalCode: ${nationalCode}, accountNumber: ${accountNumber}`,
              requestBody: JSON.stringify({ nationalCode, accountNumber }),
              stack: '',
            }),
          );
          throw new NotFoundException({
            data: null,
            message: ErrorMessages.NOT_FOUND,
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Scores not found',
          });
        }

        return {
          data: scores,
          message: ErrorMessages.SUCCESSFULL,
          statusCode: 200,
        };
      }
      // If only nationalCode is provided, find all scores for that nationalCode
      else {
        const scores = await this.scoreRepository.find({
          where: {
            nationalCode: Number(nationalCode),
          },
          order: {
            id: 'ASC',
          },
        });

        if (!scores || scores.length === 0) {
          this.eventEmitter.emit(
            'logEvent',
            new LogEvent({
              logTypes: logTypes.INFO,
              fileName: 'front-score.service',
              method: 'findScoreByNationalCodeAndAccountNumber',
              message: `No scores found for nationalCode: ${nationalCode}`,
              requestBody: JSON.stringify({ nationalCode }),
              stack: '',
            }),
          );
          throw new NotFoundException({
            data: null,
            message: ErrorMessages.NOT_FOUND,
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Scores not found',
          });
        }

        return {
          data: scores,
          message: ErrorMessages.SUCCESSFULL,
          statusCode: 200,
        };
      }
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'findScoreByNationalCodeAndAccountNumber',
        { nationalCode, accountNumber },
      );
    }
  }

  public async createScore(createScoreDto: CreateScoreDto, user: User) {
    try {
      const { nationalCode, accountNumber, score, updatedAt } = createScoreDto;

      const scoreOwner = await this.bankCoreProvider.getCustomerBriefDetail(
        Number(nationalCode),
      );
      await this.bankCoreProvider.getDepositDetail(scoreOwner.cif, [
        accountNumber,
      ]);

      const newScore = this.scoreRepository.create({
        nationalCode: Number(nationalCode),
        accountNumber: Number(accountNumber),
        score: score,
        updatedAt: new Date(updatedAt),
        insertedAt: new Date(),
      });

      const savedScore = await this.scoreRepository.save(newScore);

      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'createScore',
          message: `Score created successfully for nationalCode: ${nationalCode}, accountNumber: ${accountNumber}, score: ${createScoreDto.score} by personalCode:${user.userName}`,
          requestBody: JSON.stringify(createScoreDto),
          stack: '',
        }),
      );

      return {
        data: savedScore,
        message: ErrorMessages.SUCCESSFULL,
        statusCode: 201,
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'createScore',
        createScoreDto,
      );
    }
  }

  public async updateScore(
    id: number,
    updateScoreDto: UpdateScoreDto,
    user: User,
  ) {
    try {
      const score = await this.scoreRepository.findOne({
        where: { id },
      });
      const { nationalCode, accountNumber } = score;

      const scoreOwner = await this.bankCoreProvider.getCustomerBriefDetail(
        Number(nationalCode),
      );
      await this.bankCoreProvider.getDepositDetail(scoreOwner.cif, [
        accountNumber,
      ]);

      if (!score) {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.INFO,
            fileName: 'front-score.service',
            method: 'updateScore',
            message: `Score not found with id: ${id}`,
            requestBody: JSON.stringify({ id, updateScoreDto }),
            stack: '',
          }),
        );
        throw new NotFoundException({
          data: null,
          message: ErrorMessages.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Score not found',
        });
      }
      const beforScore = score.score;
      if (updateScoreDto.score !== undefined) {
        score.score = updateScoreDto.score;
      }
      const date = new Date(score.updatedAt);
      const beforUpdatedAt = moment(date).format('jYYYY/jMM/jDD HH:mm:ss');
      if (updateScoreDto.updatedAt !== undefined) {
        score.updatedAt = new Date(updateScoreDto.updatedAt);
      }

      const updatedScore = await this.scoreRepository.save(score);

      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'updateScore',
          message: `Score updated successfully for id: ${id}, nationalCode: ${score.nationalCode}, accountNumber: ${score.accountNumber}, scoreBefor: ${beforScore}, beforeUpdatedAt: ${beforUpdatedAt}, scoreAfter:${updateScoreDto.score}, by personalCode:${user.userName}`,
          requestBody: JSON.stringify({ id, updateScoreDto }),
          stack: '',
        }),
      );

      return {
        data: updatedScore,
        message: ErrorMessages.SUCCESSFULL,
        statusCode: 200,
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'updateScore',
        { id, updateScoreDto },
      );
    }
  }

  public async reverseTransfer(
    referenceCode: number,
    reverseScore: number,
    user: User,
  ) {
    return this.sharedProvider.reverseTransfer(
      referenceCode,
      reverseScore,
      user,
    );
  }

  public async getTaahod() {
    try {
      const query = `EXEC getTaahod`;
      const result = await this.dataSource.query(query);

      let sumTaahod = 0;
      if (result && Array.isArray(result) && result.length > 0) {
        // Handle different possible result structures
        if (typeof result[0] === 'object' && result[0] !== null) {
          // Check for common property names
          sumTaahod =
            result[0].sumTaahod ||
            result[0].result ||
            result[0][''] ||
            result[0][Object.keys(result[0])[0]] ||
            0;
        } else {
          // If result[0] is a primitive value
          sumTaahod = result[0] || 0;
        }
      }

      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'getTaahod',
          message: `getTaahod procedure executed successfully, result: ${sumTaahod}`,
          requestBody: '{}',
          stack: '',
        }),
      );

      return {
        data: { sumTaahod },
        message: ErrorMessages.SUCCESSFULL,
        statusCode: 200,
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'getTaahod',
        {},
      );
    }
  }

  public async getFacilitiesInProgress(
    user: User,
    page: number = 1,
    limit: number = 10,
    branchCode?: number,
  ) {
    try {
      let targetBranchCode: number;

      // If branchCode is provided (for admin/confirm roles), use it
      // Otherwise, get user's own branch code (for branch role)
      if (branchCode) {
        targetBranchCode = branchCode;
      } else {
        // Get user's branch code
        const userData: Partial<User> = await this.authService.getPersonalData(
          Number(user.userName),
        );

        if (!userData.branchCode) {
          throw new BadRequestException({
            message: ErrorMessages.USER_NOT_FOUND,
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
          });
        }

        targetBranchCode = userData.branchCode;
      }

      const skip = (page - 1) * limit;

      // Query UsedScores with status 0 for user's branch
      const queryBuilder = this.usedScoreRepository
        .createQueryBuilder('usedScore')
        .leftJoinAndSelect('usedScore.usedScore', 'score')
        .leftJoin(
          UsedScoreDescription,
          'usd',
          'usd.referenceCode = usedScore.referenceCode',
        )
        .addSelect('usd.description', 'description')
        .where('usedScore.branchCode = :branchCode', {
          branchCode: targetBranchCode,
        })
        .andWhere('usedScore.status = :status', { status: false })
        .orderBy('usedScore.createdAt', 'DESC');

      // Get total count
      const total = await queryBuilder.getCount();

      // Get paginated results
      const usedScores = await queryBuilder
        .skip(skip)
        .take(limit)
        .getRawAndEntities();

      // Format results
      const formattedResults: FacilityInProgressResponseDto[] =
        usedScores.entities.map((usedScore, index) => {
          const score = usedScore.usedScore;
          return {
            nationalCode: score.nationalCode,
            accountNumber: score.accountNumber,
            usedScore: usedScore.score,
            createdAt: usedScore.createdAt.toISOString(),
            createdAtShamsi: moment(usedScore.createdAt).format(
              'jYYYY/jMM/jDD HH:mm:ss',
            ),
            referenceCode: usedScore.referenceCode,
          };
        });

      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'getFacilitiesInProgress',
          message: `Facilities in progress retrieved successfully for branchCode: ${targetBranchCode}, total: ${total}`,
          requestBody: JSON.stringify({
            branchCode: targetBranchCode,
            page,
            limit,
          }),
          stack: '',
        }),
      );

      return {
        data: {
          data: formattedResults,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        message: ErrorMessages.SUCCESSFULL,
        statusCode: 200,
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'getFacilitiesInProgress',
        { page, limit },
      );
    }
  }

  public async getUsedScoresByNationalCode(
    nationalCode: number,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      // Query UsedScore rows where related Score.nationalCode matches
      const queryBuilder = this.usedScoreRepository
        .createQueryBuilder('usedScore')
        .leftJoinAndSelect('usedScore.usedScore', 'score')
        .leftJoin(
          UsedScoreDescription,
          'usd',
          'usd.referenceCode = usedScore.referenceCode',
        )
        .addSelect('usd.description', 'description')
        .where('score.nationalCode = :nationalCode', { nationalCode })
        .orderBy('usedScore.createdAt', 'DESC');

      // Get total count
      const total = await queryBuilder.getCount();

      // Get paginated results
      const usedScores = await queryBuilder
        .skip(skip)
        .take(limit)
        .getRawAndEntities();

      // Format results
      const formattedResults = usedScores.entities.map((usedScore) => ({
        id: usedScore.id,
        // nationalCode: usedScore.usedScore.nationalCode,
        accountNumber: usedScore.usedScore.accountNumber,
        score: usedScore.score,
        referenceCode: usedScore.referenceCode,
        createdAt: usedScore.createdAt.toISOString(),
        createdAtShamsi: moment(usedScore.createdAt).format('jYYYY/jMM/jDD'),
        branchCode: usedScore.branchCode,
        // status: usedScore.status,
        // description: usedScore.description || '',
      }));

      // this.eventEmitter.emit(
      //   'logEvent',
      //   new LogEvent({
      //     logTypes: logTypes.INFO,
      //     fileName: 'front-score.service',
      //     method: 'getUsedScoresByNationalCode',
      //     message: `Used scores retrieved successfully for nationalCode: ${nationalCode}, total: ${total}`,
      //     requestBody: JSON.stringify({ nationalCode, page, limit }),
      //     stack: '',
      //   }),
      // );

      return {
        data: {
          data: formattedResults,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        message: ErrorMessages.SUCCESSFULL,
        statusCode: 200,
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'getUsedScoresByNationalCode',
        { nationalCode, page, limit },
      );
    }
  }

  public async updateUsedScore(
    id: number,
    score: number,
    user: User,
  ) {
    try {
      const usedScore = await this.usedScoreRepository.findOne({
        where: { id },
        relations: ['usedScore'],
      });

      if (!usedScore) {
        throw new NotFoundException({
          message: ErrorMessages.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
        });
      }

      const beforeScore = usedScore.score;
      
      const date = new Date(usedScore.updatedAt);
      const beforUpdatedAt = moment(date).format('jYYYY/jMM/jDD HH:mm:ss');

      usedScore.score = score;
      usedScore.updatedAt = new Date();

      await this.usedScoreRepository.save(usedScore);


      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'updateUsedScore',
          message: `Used score updated successfully for id: ${id}, nationalCode: ${usedScore.usedScore.nationalCode}, accountNumber: ${usedScore.usedScore.accountNumber}, scoreBefore: ${beforeScore}, beforeUpdatedAt: ${beforUpdatedAt}, scoreAfter: ${score}, by personalCode: ${user.userName}`,
          requestBody: JSON.stringify({ id, score }),
          stack: '',
        }),
      );

      return {
        data: usedScore,
        message: ErrorMessages.SUCCESSFULL,
        statusCode: 200,
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'updateUsedScore',
        { id, score },
      );
    }
  }

  public async deleteUsedScore(
    id: number,
    user: User,
  ) {
    try {
      const usedScore = await this.usedScoreRepository.findOne({
        where: { id },
        relations: ['usedScore'],
      });

      if (!usedScore) {
        throw new NotFoundException({
          message: ErrorMessages.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
        });
      }

      await this.usedScoreRepository.remove(usedScore);

      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'deleteUsedScore',
          message: `Used score deleted successfully for id: ${id}, nationalCode: ${usedScore.usedScore.nationalCode}, accountNumber: ${usedScore.usedScore.accountNumber}, score: ${usedScore.score}, referenceCode: ${usedScore.referenceCode} by personalCode: ${user.userName}`,
          requestBody: JSON.stringify({ id }),
          stack: '',
        }),
      );

      return {
        message: ErrorMessages.SUCCESSFULL,
        statusCode: 200,
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'deleteUsedScore',
        { id },
      );
    }
  }
}
