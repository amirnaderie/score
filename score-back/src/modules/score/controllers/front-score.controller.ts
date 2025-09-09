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
  Query,
  Patch,
} from '@nestjs/common';

import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { ErrorMessages } from 'src/constants/error-messages.constants';
import { User } from 'src/interfaces/user.interface';
import { GetUser } from 'src/decorators/getUser.decorator';
import { CreateUseScoreDto } from '../dto/create-use-score.dto';
import { FrontScoreService } from '../provider/front-score.service';
import { PaginatedTransferDto } from '../dto/paginated-transfer.dto';
import { GetScoreDto } from '../dto/get-score.dto';
import { CreateScoreDto } from '../dto/create-score.dto';
import { UpdateScoreDto } from '../dto/update-score.dto';

@Controller('front/score')
export class FrontScoreController {
  constructor(private readonly frontScoreService: FrontScoreService) { }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.confirm')
  @Get('scores')
  async getScore(
    @Query() getScoreDto: GetScoreDto,
  ) {
    const { nationalCode, accountNumber } = getScoreDto;
    return this.frontScoreService.findScoreByNationalCodeAndAccountNumber(
      nationalCode,
      accountNumber,
    );
  }
  
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.view', 'score.confirm', 'score.branch')
  @Get('scores/by-national-code/:nationalCode')
  async getScoresByNationalCode(
    @Param(
      'nationalCode',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    nationalCode: number,
  ) {
    return this.frontScoreService.findScoreByNationalCodeAndAccountNumber(
      nationalCode.toString(),
      '',
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.confirm')
  @Post('scores')
  @HttpCode(200)
  async createScore(@Body() createScoreDto: CreateScoreDto, @GetUser() user: User) {
    return this.frontScoreService.createScore(createScoreDto, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.confirm')
  @Patch('scores/:id')
  async updateScore(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateScoreDto: UpdateScoreDto,
    @GetUser() user: User
  ) {
    return this.frontScoreService.updateScore(id, updateScoreDto, user);
  }

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
    return this.frontScoreService.findByNationalCodeForFront(nationalCode);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.confirm', 'score.branch')
  @Post('consume')
  @HttpCode(200)
  usedScoreForFront(
    @GetUser() user: User,
    @Body() createUseScoreDto: CreateUseScoreDto,
  ) {
    return this.frontScoreService.usedScoreForFront(createUseScoreDto, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.confirm', 'score.branch')
  @Put('accept-use')
  @HttpCode(200)
  acceptUsedScoreFront(
    @GetUser() user: User,
    @Body(
      'referenceCode',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    referenceCode: number,
  ) {
    return this.frontScoreService.acceptUsedScoreFront(referenceCode, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.confirm', 'score.branch')
  @Delete('cancel-use')
  @HttpCode(200)
  cancleUsedScoreFront(
    @GetUser() user: User,
    @Body(
      'referenceCode',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    referenceCode: number,
  ) {
    return this.frontScoreService.cancleUsedScoreFront(referenceCode, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.confirm', 'score.branch', 'score.view')
  @Get('transfers/all')
  async getAllTransfersPaginated(@Query() query: PaginatedTransferDto) {
    const nationalCode = Number(query.nationalCode);
    const accountNumber = Number(query.accountNumber);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const sortBy = query.sortBy || 'date';
    const sortOrder = query.sortOrder || 'DESC';

    return this.frontScoreService.getAllTransfersPaginated(
      nationalCode,
      accountNumber,
      page,
      limit,
      sortBy,
      sortOrder
    );
  }
}
