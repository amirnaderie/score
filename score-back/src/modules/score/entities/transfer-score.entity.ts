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
    type: 'int',
    nullable: false,
    default: 0,
  })
  score: number;

  @Column({
    type: 'varchar',
    nullable: true,
    length: 30,
  })
  userId: string;

@Index('IX_TransferScores_referenceCode')
  @Column({
    type: 'int',
    nullable: true,
  })
  referenceCode
}
