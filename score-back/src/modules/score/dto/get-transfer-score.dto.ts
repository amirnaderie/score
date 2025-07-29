import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GetTransferScoreDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'کد ملی باید عددی باشد' })
  @MaxLength(10)
  @MinLength(5)
  nationalCode: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'شماره حساب باید عددی باشد' })
  @MaxLength(14)
  @MinLength(5)
  accountNumber: string;
}
