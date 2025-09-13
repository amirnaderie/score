import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateScoreDto {
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
  @Type(() => Number)
  score: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  updatedAt: string;
}
