import { Knex } from 'knex';
import { BaseEntity } from '../BaseEntity';
import { DatasetFileSchema } from '@shared/interfaces/IDatasetFile';

export class DatasetFileEntity extends BaseEntity<DatasetFileSchema> {
  constructor(tableName: string = 'svsn_dataset_file') {
    super(tableName, {
      file_id: {
        type: 'increments',
      },
      dataset_id: {
        type: 'integer',
        unique: true,
      },
      file_path: {
        type: 'string',
        options: [255],
        unique: true,
      },
      file_type: {
        type: 'string',
        options: [15],
        notNullable: true,
      },
      width: {
        type: 'integer',
      },
      height: {
        type: 'integer',
      },
      quick_label_type: {
        type: 'string',
        options: [15],
      },
      registered_date: {
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
