import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FacilitiesInProgressDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class FacilityInProgressResponseDto {
  nationalCode: number;
  accountNumber: number;
  usedScore: number;
  createdAt: string;
  createdAtShamsi: string;
  referenceCode: number;
}

export class PaginatedFacilitiesInProgressResponseDto {
  data: FacilityInProgressResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}