import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateScoreDto {
  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsString()
  updatedAt?: string;
}