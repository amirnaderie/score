import { IsOptional, IsString, IsIn } from 'class-validator';

export class ExportLogsDto {
  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsOptional()
  @IsIn(['method', 'createdAt'])
  sortBy?: 'method' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  methods?: string;
}