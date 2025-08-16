import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsInt,
  IsPositive,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUseScoreDto {

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'شماره حساب باید عددی باشد' })
  @MaxLength(14)
  @MinLength(4)
  accountNumber: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'کد ملی باید عددی باشد' })
  @MaxLength(11)
  @MinLength(5)
  nationalCode: string;

  @IsNotEmpty()
  @IsInt()
  @IsPositive({ message: 'امتیاز باید بزرگتر از صفر باشد' })
  @Type(() => Number)
  score: number;

  // Add this field to the existing CreateUseScoreDto class
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'توضیحات نباید بیشتر از 500 کاراکتر باشد' })
  description?: string;
}
