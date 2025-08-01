import { Entity, Column, PrimaryGeneratedColumn, Check } from 'typeorm';
import { logTypes } from '../enums/logType.enum';
const tehranNowSql = () =>
  "SWITCHOFFSET(SYSDATETIMEOFFSET(), DATEPART(TZOFFSET, SYSDATETIMEOFFSET() AT TIME ZONE 'Iran Standard Time'))";

@Entity('Logs')
export class Logs {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  fileName: string;

  @Check('CK_Logs_logTypes', "logTypes IN ('info', 'warning', 'error')")
  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    default: logTypes.INFO,
  })
  logTypes: logTypes;

  @Column()
  method: string;

  @Column({
    type: 'nvarchar',
    length: 'max',
    nullable: true,
  })
  message: string | null;

  @Column({
    type: 'nvarchar',
    length: 'max',
    nullable: true,
  })
  stack: string | null;

  @Column({
    type: 'nvarchar',
    length: 'max',
    nullable: true,
  })
  requestBody: string | null;

  @Column({
    name: 'created_at',
    type: 'datetime2', // Use datetime2 instead of datetime
    precision: 0, // Reduced precision to save storage (datetime2(0) takes 6 bytes)
    select: false,
    default: () => tehranNowSql(),
  })
  createdAt: Date;

  @Column({
    type: 'int',
    nullable: true,
  })
  lineNumber: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  userId: number;
}
