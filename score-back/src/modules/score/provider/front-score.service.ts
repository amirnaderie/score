import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Score } from '../entities/score.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogEvent } from '../../../modules/event/log.event';
import { logTypes } from '../../../modules/event/enums/logType.enum';
import { ErrorMessages } from '../../../constants/error-messages.constants';
import handelError from '../../../utility/handel-error';
import { UsedScore } from '../entities/used-score.entity';
import { CreateUseScoreDto } from '../dto/create-use-score.dto';
import { BankCoreProvider } from './coreBank.provider';
import { User } from 'src/interfaces/user.interface';
import { AuthService } from 'src/modules/auth/provider/auth.service';
import moment from 'moment-jalaali';
import { SharedProvider } from './shared.provider';

@Injectable()
export class FrontScoreService {
  constructor(
    private eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
    @InjectRepository(Score)
    private readonly scoreRepository: Repository<Score>,
    @InjectRepository(UsedScore)
    private readonly UsedScoreRepository: Repository<UsedScore>,
    private readonly bankCoreProvider: BankCoreProvider,
    private readonly sharedProvider: SharedProvider,
  ) {}

  public async findByNationalCodeForFront(nationalCode: number) {
    let scoresOfNationalCode: Partial<Score>[] | null;
    const scoresRec: any[] = [];

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
            fileName: 'front-score.service',
            method: 'findByNationalCodeForFront',
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
      } catch {}
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
    const scoreRec = await this.scoreRepository.findBy({
      id: createUseScoreDto.scoreId,
    });

    if (!scoreRec || scoreRec.length === 0 || !scoreRec[0]?.id) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'usedScoreForFront',
          message: 'ُThere is no record for given nationalCode',
          requestBody: JSON.stringify({
            scoreId: createUseScoreDto.scoreId,
            user,
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
    const scoreRow = await this.scoreRepository.query(
      'exec getScores @nationalCode=@0,@accountNumber=@1',
      [scoreRec[0].nationalCode, scoreRec[0].accountNumber],
    );

    return this.sharedProvider.consumeScore(
      scoreRow,
      createUseScoreDto.score,
      Number(user.userName),
      null,
    );
  }

  async acceptUsedScoreFront(usedScoreId: number, user: User) {
    const usedScoreRec = await this.UsedScoreRepository.findOne({
      where: {
        id: usedScoreId,
      },
    });
    const userData: Partial<User> = await this.authService.getPersonnelData(
      Number(user.userName),
    );
    if (
      !usedScoreRec ||
      usedScoreRec.branchCode !== Number(userData.branchCode)
    )
      throw new NotFoundException({
        data: [],
        message: ErrorMessages.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      });
    usedScoreRec.status = true;
    try {
      await this.UsedScoreRepository.save(usedScoreRec);
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.INFO,
          fileName: 'front-score.service',
          method: 'acceptUsedScore',
          message: `user Accepted usedScore`,
          requestBody: JSON.stringify({ usedScoreRec, user }),
          stack: '',
        }),
      );
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'front-score.service',
        'acceptUsedScoreFront',
        { usedScoreId, personalCode: userData.branchCode },
      );
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
    });
    const userData: Partial<User> = await this.authService.getPersonnelData(
      Number(user.userName),
    );
    if (
      !usedScoreRec ||
      usedScoreRec.branchCode !== Number(userData.branchCode)
    )
      throw new NotFoundException({
        data: {},
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
          fileName: 'front-score.service',
          method: 'cancleUsedScoreFront',
          message: `personalCode:${userData.personalCode} branchCode:${user.branchCode} deleted a usedScore `,
          requestBody: JSON.stringify({ usedScoreRec, user }),
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
          usedScoreId,
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
