import { IsOptional, IsInt, IsString, IsIn, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetLogsDto {
  @IsString()
  from: string;

  @IsString()
  to: string;

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

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return 'createdAt';
    return value.toLowerCase() === 'created_at' ? 'createdAt' : value;
  })
  @IsIn(['method', 'createdAt'])
  sortBy: 'method' | 'createdAt' = 'createdAt';

  @IsOptional()
  @Transform(({ value }) => (value ? value.toUpperCase() : 'DESC'))
  @IsIn(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC';


  @IsOptional()
  @IsString()
  methods?: string;
}