import { BaseEntity, Column, Entity, Index, OneToMany } from 'typeorm';
import { TransferScore } from './transfer-score.entity';
import { UsedScore } from './used-score.entity';

@Index('IX_Scores_nationalCode_accountNumber', ['nationalCode', 'accountNumber']) // 👈 Composite index here
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
    type: 'varchar',
    nullable: false,
    length: 8,
  })
  openDate: string;

  @Column({
    name: 'started_at',
    type: 'datetime2',
    precision: 0,
    select: true,
    nullable: true,
   
  })
  startDate: Date;
}
