import { BaseEntity } from 'src/modules/base/base.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('TransferScoreDescriptions')
export class TransferScoreDescription extends BaseEntity {
  @PrimaryColumn({
    type: 'bigint',
    nullable: false,
  })
  referenceCode: number;

  @Column({
    type: 'nvarchar',
    nullable: true,
    length: 500,
  })
  description: string;
}
