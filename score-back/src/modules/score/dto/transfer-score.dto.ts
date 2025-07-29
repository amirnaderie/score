import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Min,
  IsOptional,
  Max,
} from 'class-validator';

export class TransferScoreDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'کد ملی باید عددی باشد' })
  @MaxLength(10)
  @MinLength(5)
  fromNationalCode: string;
  
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'شماره حساب باید عددی باشد' })
  @MaxLength(14)
  @MinLength(5)
  fromAccountNumber: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'کد ملی باید عددی باشد' })
  @MaxLength(10)
  @MinLength(5)
  toNationalCode: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'شماره حساب باید عددی باشد' })
  @MaxLength(14)
  @MinLength(5)
  toAccountNumber: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive({ message: 'امتیاز باید بزرگتر از صفر باشد' })
  score: number;

  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'شناسه ارجاع باید عدد مثبت باشد' })
  @Min(10000, { message: 'شناسه ارجاع باید حداقل 5 رقم باشد' })
  @Max(999999999, { message: 'شناسه ارجاع باید حداکثر 9 رقم باشد' })
  referenceCode?: number;
}
