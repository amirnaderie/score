import { BaseEntity } from 'src/modules/base/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Score } from './score.entity';

@Entity('TransferScores')
export class TransferScore extends BaseEntity {
  @Column({
    type: 'int',
    primary: true,
    generated: 'increment',
    primaryKeyConstraintName: 'PK_TransferScores',
  })
  id: number;

  @Index('IX_Scores_fromScoreId')
  @ManyToOne(() => Score, (fromScore) => fromScore.id)
  @JoinColumn({ name: 'fromScoreId' })
  fromScore: Score;

  @Index('IX_Scores_toScoreId')
  @ManyToOne(() => Score, (toScore) => toScore.id)
  @JoinColumn({ name: 'toScoreId' })
  toScore: Score;

  @Column({
    type: 'bigint',
    nullable: false,
    default: 0,
  })
  score: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  personalCode: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  branchCode: number;

  @Index('IX_TransferScores_referenceCode')
  @Column({
    type: 'bigint',
    nullable: true,
  })
  referenceCode;

   @Column({
      name: 'reversed_at',
      type: 'datetime2', // Use datetime2 instead of datetime
      precision: 0, // Reduced precision to save storage (datetime2(0) takes 6 bytes)
      select: true,
      nullable: true,
    })
    reversedAt: Date;
}
