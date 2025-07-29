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
  @IsNumber()
  scoreId: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive({ message: 'score should be positive' })
  @Type(() => Number)
  score: number;
}
