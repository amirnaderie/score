import { BaseEntity, Column, Entity, Index, OneToMany } from 'typeorm';
import { TransferScore } from './transfer-score.entity';
import { UsedScore } from './used-score.entity';

const tehranNowSql = () =>
  "SWITCHOFFSET(SYSDATETIMEOFFSET(), DATEPART(TZOFFSET, SYSDATETIMEOFFSET() AT TIME ZONE 'Iran Standard Time'))";

@Index('IX_Scores_nationalCode_accountNumber', ['nationalCode', 'accountNumber', 'updatedAt']) 

@Entity('Scores')
export class Score extends BaseEntity {
  @Column({
    type: 'int',
    primary: true,
    generated: 'increment',
    primaryKeyConstraintName: 'PK_Scores',
  })
  id: number;

  //@Index('IX_Scores_accountNumber')
  @Column({ type: 'bigint', nullable: false })
  accountNumber: number;

  //@Index('IX_Scores_nationalCode')
  @Column({
    type: 'bigint',
    nullable: false,
  })
  nationalCode: number;

  @Column({
    type: 'bigint',
    nullable: false,
    default: 0,
  })
  score: number;

  @OneToMany(
    () => TransferScore,
    (transferScoreFrom) => transferScoreFrom.fromScore,
  )
  transferScoreFrom: TransferScore[];

  @OneToMany(() => TransferScore, (transferScoreTo) => transferScoreTo.toScore)
  transferScoreTo: TransferScore[];

  @OneToMany(() => UsedScore, (usedScore) => usedScore.usedScore)
  usedScore: UsedScore[];

  @Column({
    name: 'updated_at',
    type: 'datetime2',
    precision: 0,
    select: true,
    nullable: true,
  })
  updatedAt: Date;

  @Column({
    name: 'inserted_at',
    type: 'datetime2',
    precision: 0,
    select: true,
    nullable: true,
    default: () => tehranNowSql(),
  })
  insertedAt: Date;

  @Column({ type: 'bit', nullable: true })
  isBulkInserted: boolean | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  accountType: number;
}
