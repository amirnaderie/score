import { IsNotEmpty, IsString } from 'class-validator';

export class GetScoreDto {
  @IsNotEmpty()
  @IsString()
  nationalCode: string;

  @IsNotEmpty()
  @IsString()
  accountNumber: string;
}