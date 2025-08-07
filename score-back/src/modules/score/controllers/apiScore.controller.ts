import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  BadRequestException,
  HttpCode,
  Req,
  Put,
  Delete,
} from '@nestjs/common';
import { BankCoreProvider } from '../provider/coreBank.provider';
import { ScoreService } from '../provider/score.service';
import { ApiKeyGuard } from 'src/guards/api-key.guard';
import { GetTransferScoreDto } from '../dto/get-transfer-score.dto';
import { ErrorMessages } from 'src/constants/error-messages.constants';
import { TransferScoreDto } from '../dto/transfer-score.dto';
import { UseScoreDto } from '../dto/use-score.dto';

@Controller('score')
export class APIScoreController {
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
  useScore(@Body() useScoreDto: UseScoreDto) {
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

  @UseGuards(ApiKeyGuard)
  @Put('acceptUse')
  acceptUsedScore(
    @Body(
      'referenceCode',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    referenceCode: number,
  ) {
    return this.scoreService.acceptUsedScore(referenceCode);
  }

  @UseGuards(ApiKeyGuard)
  @Delete('cancelUse')
  cancleUsedScore(
    @Body(
      'referenceCode',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    referenceCode: number,
  ) {
    return this.scoreService.cancleUsedScore(referenceCode);
  }

  @Get('testApi/1')
  testApi1() {
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
