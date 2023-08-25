import knex, { Knex } from 'knex';
import { BaseEntity } from '../BaseEntity';
import { DatasetSchema } from '@shared/interfaces/IDataset';

export class DatasetEntity extends BaseEntity<DatasetSchema> {
  constructor(tableName: string = 'svsn_dataset') {
    super(tableName, {
      dataset_id: {
        type: 'increments',
        comment: 'index field',
      },
      dataset_name: {
        type: 'string',
        options: [63],
        unique: true,
      },
      description: {
        type: 'string',
        options: [255],
      },
      modified_date: {
        type: 'timestamp',
        options: [
          {
            precision: 6,
          },
        ],
      },
      created_date: {
        type: 'timestamp',
        options: [
          {
            precision: 6,
          },
        ],
      },
    });
  }
}
