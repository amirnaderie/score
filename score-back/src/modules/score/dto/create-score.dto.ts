import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateScoreDto {
  @IsNotEmpty()
  @IsString()
  nationalCode: string;

  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @IsNotEmpty()
  @IsNumber()
  score: number;

  @IsNotEmpty()
  @IsString()
  updatedAt: string;
}