import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUseScoreDto {

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'شماره حساب باید عددی باشد' })
  @MaxLength(14)
  @MinLength(5)
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
}
