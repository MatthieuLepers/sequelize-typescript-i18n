import {
  AutoIncrement,
  DataType,
  Model,
  PrimaryKey,
} from 'sequelize-typescript';

import { Column, Table } from '@/index';

@Table({
  modelName: 'articles',
  i18n: true,
})
export class Article extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING,
    i18n: true,
  })
  declare title: string;

  declare i18n: any[];
}
