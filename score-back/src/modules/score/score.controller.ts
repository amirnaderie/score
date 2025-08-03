import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  BadRequestException,
  HttpCode,
  Req,
  ValidationPipe,
  Injectable,
  Module,
  Put,
} from '@nestjs/common';

import { ScoreService } from './provider/score.service';
import { ApiKeyGuard } from 'src/guards/api-key.guard';
import { ErrorMessages } from 'src/constants/error-messages.constants';
import { TransferScoreDto } from './dto/transfer-score.dto';
import { CreateUseScoreDto } from './dto/create-use-score.dto';
import { GetTransferScoreDto } from './dto/get-transfer-score.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { GetUser } from 'src/decorators/getUser.decorator';
import { User } from 'src/interfaces/user.interface';
import { UseScoreDto } from './dto/use-score.dto';
import { BankCoreProvider } from './provider/coreBank.provider';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';

@Controller('score')
export class ScoreController {
  constructor(
    private readonly scoreService: ScoreService,
    private readonly bankCoreProvider: BankCoreProvider,
  ) {}

  @UseGuards(ApiKeyGuard)
  @Get('getTransfersFrom')
  getTransferScoreFrom(@Query() getTransferScoreDto: GetTransferScoreDto) {
    const fromNationalCode = Number(getTransferScoreDto.nationalCode);
    const fromAccountNumber = Number(getTransferScoreDto.accountNumber);

    return this.scoreService.getTransferScoreFrom(
      fromNationalCode,
      fromAccountNumber,
    );
  }

  @UseGuards(ApiKeyGuard)
  @Get('getTransfersTo')
  getTransferScoreTo(@Query() getTransferScoreDto: GetTransferScoreDto) {
    const fromNationalCode = Number(getTransferScoreDto.nationalCode);
    const fromAccountNumber = Number(getTransferScoreDto.accountNumber);

    return this.scoreService.getTransferScoreTo(
      fromNationalCode,
      fromAccountNumber,
    );
  }

  @UseGuards(ApiKeyGuard)
  @Get('getTransferByReferenceCode/:referenceCode')
  getTransferByReferenceCode(
    @Param(
      'referenceCode',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    referenceCode: number,
  ) {
    return this.scoreService.getTransferByReferenceCode(referenceCode);
  }

  @UseGuards(ApiKeyGuard)
  @Get('getUsedScoreByReferenceCode/:referenceCode')
  getUsedScoreByReferenceCode(
    @Param(
      'referenceCode',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    referenceCode: number,
  ) {
    return this.scoreService.getUsedScoreByReferenceCode(referenceCode);
  }

  //@UseGuards(AuthGuard, RolesGuard)
  @UseGuards(AuthGuard)
  //@Roles('score.view')
  @Get(':nationalCode')
  findOneByAccountNumber(
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

  @UseGuards(ApiKeyGuard)
  @Get('nationalCode/:nationalCode')
  findOneByNationalCode(
    @Param(
      'nationalCode',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    nationalCode: number,
  ) {
    return this.scoreService.findByNationalCode(nationalCode);
  }

  @UseGuards(ApiKeyGuard)
  @Post('transfer')
  @HttpCode(200)
  transferScore(@Body() transferScoreDto: TransferScoreDto, @Req() req) {
    const fromNationalCode = Number(transferScoreDto.fromNationalCode);
    const toNationalCode = Number(transferScoreDto.toNationalCode);
    const fromAccountNumber = Number(transferScoreDto.fromAccountNumber);
    const toAccountNumber = Number(transferScoreDto.toAccountNumber);
    const score = transferScoreDto.score;
    const ip = req.ip || req.connection.remoteAddress;
    return this.scoreService.transferScore(
      fromNationalCode,
      toNationalCode,
      fromAccountNumber,
      toAccountNumber,
      score,
      ip,
      transferScoreDto.referenceCode ?? null,
    );
  }

  @UseGuards(ApiKeyGuard)
  @Post('useScore')
  @HttpCode(200)
  useScore(@Body() useScoreDto: UseScoreDto, @Req() req) {
    const nationalCode = Number(useScoreDto.nationalCode);
    const accountNumber = Number(useScoreDto.accountNumber);
    const score = useScoreDto.score;
    return this.scoreService.usedScore(
      nationalCode,
      accountNumber,
      score,
      useScoreDto.referenceCode ?? null,
    );
  }

  @UseGuards(AuthGuard)
  @Post('consume')
  @HttpCode(200)
  usedScoreForFront(
    @GetUser() user: User,
    @Body() createUseScoreDto: CreateUseScoreDto,
    @Req() req,
  ) {
    const ip = req.ip || req.connection.remoteAddress;
    return this.scoreService.usedScoreForFront(createUseScoreDto, user, ip);
  }
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  @Put('cancel-use')
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

  @Get('testApi/1')
  testApi1(@Req() req) {
    return this.bankCoreProvider.getsessionId();
  }

  @Get('testApi/2')
  testApi2() {
    return this.bankCoreProvider.getCustomerBriefDetail(2880501520);
  }

  @Get('testApi/3')
  testApi3() {
    return this.bankCoreProvider.getDepositDetail(784877, ['3120106246465']);
  }
}
