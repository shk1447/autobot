import knex, { Knex } from 'knex';
import { BaseEntity } from '../BaseEntity';

import { LogSchema } from '@shared/interfaces/ILog';

export class LogEntity extends BaseEntity<LogSchema> {
  constructor(tableName: string = 'svsn_log') {
    super(tableName, {
      log_id: {
        type: 'increments',
        comment: 'index field',
      },
      log_name: {
        type: 'string',
        options: [20],
      },
      log_type: {
        type: 'string',
        options: [20],
      },
      log_level: {
        type: 'string',
        options: [20],
      },
      log_message: {
        type: 'text',
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
