import { BaseEntity } from 'src/modules/base/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Score } from './score.entity';

@Entity('UsedScores')
export class UsedScore extends BaseEntity {
  @Column({
    type: 'int',
    primary: true,
    generated: 'increment',
    primaryKeyConstraintName: 'PK_UsedScore',
  })
  id: number;

  @Index('IX_Scores_scoreId')
  @ManyToOne(() => Score, (usedScore) => usedScore.id)
  @JoinColumn({ name: 'scoreId' })
  usedScore: Score;

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

  @Column({
    type: 'nvarchar',
    nullable: true,
    length: 60,
  })
  branchName: string;

  @Index('IX_TransferScores_referenceCode')
  @Column({
    type: 'int',
    nullable: true,
  })
  referenceCode;

  @Column({
    type: 'bit',
    nullable: true,
    default: false,
  })
  status: boolean;
}
