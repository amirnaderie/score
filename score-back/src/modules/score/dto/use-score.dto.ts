import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UseScoreDto {
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

  @IsNotEmpty()
  @IsNumber()
  @IsPositive({ message: 'امتیاز باید بزرگتر از صفر باشد' })
  score: number;

  @IsNumber()
  @IsPositive({ message: 'شناسه ارجاع باید عدد مثبت باشد' })
  @Min(10000, { message: 'شناسه ارجاع باید حداقل 5 رقم باشد' })
  @Max(999999999, { message: 'شناسه ارجاع باید حداکثر 9 رقم باشد' })
  referenceCode?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'توضیحات نباید بیشتر از 500 کاراکتر باشد' })
  description?: string;
}
