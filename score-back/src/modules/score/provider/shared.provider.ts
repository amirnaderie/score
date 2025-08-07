import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsedScore } from '../entities/used-score.entity';
import { ScoreInterface } from '../interfaces/score.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogEvent } from '../../../modules/event/log.event';
import { logTypes } from '../../../modules/event/enums/logType.enum';
import { ErrorMessages } from '../../../constants/error-messages.constants';
import handelError from '../../../utility/handel-error';
import { AuthService } from 'src/modules/auth/provider/auth.service';

@Injectable()
export class SharedProvider {
  constructor(
    private eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
    @InjectRepository(UsedScore)
    private readonly UsedScoreRepository: Repository<UsedScore>,
  ) {}

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
        throw new BadRequestException({
          message: ErrorMessages.INSUFFICIENT_SCORE,
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
        });
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
}
