import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PaginatedTransferDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'کد ملی باید عددی باشد' })
  @MaxLength(11)
  @MinLength(5)
  nationalCode: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'شماره حساب باید عددی باشد' })
  @MaxLength(14)
  @MinLength(4)
  accountNumber: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number = 10;

  @IsOptional()
  @IsString()
  @IsIn(['date', 'score'])
  sortBy: string = 'date';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder: string = 'DESC';
}

export class TransferResponseDto {
  referenceCode: number;
  fromNationalCode: number;
  fromAccountNumber: number;
  toNationalCode: number;
  toAccountNumber: number;
  score: number;
  transferDate: string;
  transferDateShamsi: string;
  direction: 'from' | 'to';
  reversedAt?: string;
  description?: string;
}

export class PaginatedTransferResponseDto {
  data: TransferResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}