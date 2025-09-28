import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReverseTransferDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  referenceCode: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  reverseScore: number;

}