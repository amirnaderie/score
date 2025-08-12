import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Score } from '../entities/score.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { logTypes } from '../../../modules/event/enums/logType.enum';
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
const moment = require('moment-jalaali');

@Injectable()
export class FrontScoreService {
  private staleMonths: string;
  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
    @InjectRepository(Score)
    private readonly scoreRepository: Repository<Score>,
    @InjectRepository(UsedScore)
    private readonly UsedScoreRepository: Repository<UsedScore>,
    private readonly bankCoreProvider: BankCoreProvider,
    private readonly sharedProvider: SharedProvider,
    private readonly dataSource: DataSource,
  ) {
    this.staleMonths = this.configService.get<string>('SCORE_STALE_MONTHS');
  }

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
            message: 'ُThere is no record for given nationalCode',
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
        const scoreRecs = await this.sharedProvider.getValidScores(score.accountNumber, nationalCode)
        let usedScore: any[] = [];
        if (scoreRecs && scoreRecs.length > 0) {
          const scoreIds = scoreRecs.map(rec => rec.id);

          const usedRecs = await this.UsedScoreRepository
            .createQueryBuilder('usedScore')
            .select([
              'usedScore.referenceCode as referenceCode',
              'SUM(usedScore.score) as score',
              'MAX(usedScore.createdAt) as createdAt',
              'MAX(usedScore.updatedAt) as updatedAt',
              'MAX(usedScore.personalCode) as personalCode',
              'CAST(MIN(CAST(usedScore.status as INT)) as BIT) as status',
              'MAX(usedScore.branchCode) as branchCode',
            ])
            .where('usedScore.scoreId IN (:...scoreIds)', { scoreIds })
            .groupBy('usedScore.referenceCode')
            .orderBy('MIN(usedScore.createdAt)', 'ASC')
            .getRawMany();

          if (usedRecs && usedRecs.length > 0) {
            usedRecs.map((usedItem: UsedScore) => {
              usedScore.push({
                referenceCode: usedItem.referenceCode,
                score: usedItem.score,
                createdAt: moment(usedItem.createdAt).format('jYYYY/jMM/jDD'),
                updatedAt: moment(usedItem.updatedAt).format('jYYYY/jMM/jDD'),
                status: usedItem.status,
                personalCode: usedItem.personalCode,
                branchCode: usedItem.branchCode,
                branchName: usedItem.branchName,
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
    );
  }

  async acceptUsedScoreFront(referenceCode: number, user: User) {
    const usedScoreRec = await this.UsedScoreRepository.find({
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
        data: [],
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
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
          fileName: 'front-score.service',
          method: 'acceptUsedScore',
          message: `personalCode:${user.userName} branchCode:${userData.branchCode} deleted a usedScore `,
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
    const usedScoreRec = await this.UsedScoreRepository.find({
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
      await this.UsedScoreRepository.remove(usedScoreRec);
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'cancleUsedScoreFront',
          message: `personalCode:${user.userName} branchCode:${userData.branchCode} deleted a usedScore `,
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
}
