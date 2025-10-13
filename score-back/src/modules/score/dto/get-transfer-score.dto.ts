import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GetTransferScoreDto {
  //@IsNotEmpty()
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'کد ملی باید عددی باشد' })
  @MaxLength(11)
  @MinLength(5)
  nationalCode: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'شماره حساب باید عددی باشد' })
  @MaxLength(14)
  @MinLength(4)
  accountNumber: string;
}
