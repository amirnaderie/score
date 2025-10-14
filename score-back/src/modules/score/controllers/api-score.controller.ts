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
import { ApiKeyGuard } from 'src/guards/api-key.guard';
import { GetTransferScoreDto } from '../dto/get-transfer-score.dto';
import { ErrorMessages } from 'src/constants/error-messages.constants';
import { TransferScoreDto } from '../dto/transfer-score.dto';
import { UseScoreDto } from '../dto/use-score.dto';
import { ApiScoreService } from '../provider/api-score.service';
import { ReverseTransferDto } from '../dto/reverse-transfer.dto';

@Controller('score')
export class APIScoreController {
  constructor(
    private readonly apiScoreService: ApiScoreService,
    private readonly bankCoreProvider: BankCoreProvider,
  ) {}

  @UseGuards(ApiKeyGuard)
  @Get('getTransfers/:nationalCode')
  getTransferScore(
    @Param(
      'nationalCode',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    nationalCode: number,
  ) {
    return this.apiScoreService.getTransferScore(nationalCode);
  }

  @UseGuards(ApiKeyGuard)
  @Get('getTransfersFrom')
  getTransferScoreFrom(@Query() getTransferScoreDto: GetTransferScoreDto) {
    const fromNationalCode = Number(getTransferScoreDto.nationalCode);
    const fromAccountNumber = Number(getTransferScoreDto.accountNumber);

    return this.apiScoreService.getTransferScoreFrom(
      fromNationalCode,
      fromAccountNumber,
    );
  }

  @UseGuards(ApiKeyGuard)
  @Get('getTransfersTo')
  getTransferScoreTo(@Query() getTransferScoreDto: GetTransferScoreDto) {
    const toNationalCode = Number(getTransferScoreDto.nationalCode);
    const toAccountNumber = Number(getTransferScoreDto.accountNumber);

    return this.apiScoreService.getTransferScoreTo(
      toNationalCode,
      toAccountNumber,
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
    return this.apiScoreService.getTransferByReferenceCode(referenceCode);
  }

  @UseGuards(ApiKeyGuard)
  @Get('getUsedScoreByNationalCode/:nationalCode')
  getUsedScoreByNationalCode(
    @Param(
      'nationalCode',
      new ParseIntPipe({
        exceptionFactory: (error) =>
          new BadRequestException(ErrorMessages.VALIDATE_INFO_FAILED),
      }),
    )
    nationalCode: number,
  ) {
    return this.apiScoreService.getUsedScoreByNationalCode(nationalCode);
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
    return this.apiScoreService.getUsedScoreByReferenceCode(referenceCode);
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
    return this.apiScoreService.findByNationalCode(nationalCode);
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
    return this.apiScoreService.transferScore(
      fromNationalCode,
      toNationalCode,
      fromAccountNumber,
      toAccountNumber,
      score,
      ip,
      transferScoreDto.referenceCode ?? null,
      transferScoreDto.description,
    );
  }

  @UseGuards(ApiKeyGuard)
  @Post('useScore')
  @HttpCode(200)
  useScore(@Body() useScoreDto: UseScoreDto) {
    const nationalCode = Number(useScoreDto.nationalCode);
    const accountNumber = Number(useScoreDto.accountNumber);
    const score = useScoreDto.score;
    return this.apiScoreService.usedScore(
      nationalCode,
      accountNumber,
      score,
      useScoreDto.referenceCode ?? null,
      useScoreDto.description,
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
    return this.apiScoreService.acceptUsedScore(referenceCode);
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
    return this.apiScoreService.cancleUsedScore(referenceCode);
  }

  @UseGuards(ApiKeyGuard)
  @Post('reverse-transfer')
  @HttpCode(200)
  async reverseTransfer(@Body() reverseTransferDto: ReverseTransferDto) {
    return this.apiScoreService.reverseTransfer(
      reverseTransferDto.referenceCode,
      reverseTransferDto.reverseScore,
    );
  }
}
