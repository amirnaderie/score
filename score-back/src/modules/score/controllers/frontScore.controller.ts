import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  HttpCode,
  Put,
  Delete,
} from '@nestjs/common';

import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { ScoreService } from '../provider/score.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ErrorMessages } from 'src/constants/error-messages.constants';
import { User } from 'src/interfaces/user.interface';
import { GetUser } from 'src/decorators/getUser.decorator';
import { CreateUseScoreDto } from '../dto/create-use-score.dto';

@Controller('score')
export class FrontScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.view', 'score.confirm', 'score.branch')
  @Get(':nationalCode')
  findByNationalCodeForFront(
    @Param(
      'nationalCode',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    nationalCode: number,
  ) {
    return this.scoreService.findByNationalCodeForFront(nationalCode);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.confirm', 'score.branch')
  @Post('consume')
  @HttpCode(200)
  usedScoreForFront(
    @GetUser() user: User,
    @Body() createUseScoreDto: CreateUseScoreDto,
  ) {
    return this.scoreService.usedScoreForFront(createUseScoreDto, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.confirm', 'score.branch')
  @Put('accept-use')
  @HttpCode(200)
  acceptUsedScoreFront(
    @GetUser() user: User,
    @Body(
      'usedScoreId',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    usedScoreId: number,
  ) {
    return this.scoreService.acceptUsedScoreFront(usedScoreId, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.confirm', 'score.branch')
  @Delete('cancel-use')
  @HttpCode(200)
  cancleUsedScoreFront(
    @GetUser() user: User,
    @Body(
      'usedScoreId',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    usedScoreId: number,
  ) {
    return this.scoreService.cancleUsedScoreFront(usedScoreId, user);
  }
}
