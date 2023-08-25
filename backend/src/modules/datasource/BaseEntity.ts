import { Knex } from 'knex';
import _ from 'lodash';

export interface ColumnOption {
  type: 'increments' | 'string' | 'integer' | 'bigint' | 'text' | 'timestamp';
  comment?: string;
  unique?: boolean;
  index?: string[];
  default?: any;
  nullable?: boolean;
  notNullable?: boolean;
  options?: any[];
}

export type Schema<T> = {
  [K in keyof T]: T[K] extends any ? ColumnOption : ColumnOption;
};

export class BaseEntity<T> {
  public tableName: string;
  // private database: Knex<any>;
  private schema: Record<string, ColumnOption>;
  static database: Knex<any>;
  constructor(tableName: string, schema: Schema<T>) {
    this.tableName = tableName;
    this.schema = schema;
  }
  create() {
    return BaseEntity.database.schema
      .hasTable(this.tableName)
      .then(exists => {
        if (!exists) {
          var schema = this.schema;
          var table_name = this.tableName;
          return BaseEntity.database.schema.createTable(
            this.tableName,
            (t: Knex.TableBuilder) => {
              var indexer: any = {};
              var unique_keys: any = [];

              _.each(schema, (d: ColumnOption, name: string) => {
                console.log(d.type, name, d);
                var column = t[d.type].apply(t, [name].concat(d.options));
                if (d.default) column.defaultTo(d.default);
                if (d.unique) unique_keys.push(name);
                if (d.nullable) column.nullable();
                if (d.notNullable) column.notNullable();

                if (d.index && d.index.length > 0) {
                  _.each(d.index, (index_name, k) => {
                    if (indexer[table_name + '_' + index_name]) {
                      indexer[table_name + '_' + index_name].push(name);
                    } else {
                      indexer[table_name + '_' + index_name] = [name];
                    }
                  });
                }
              });
              if (unique_keys.length > 0) t.unique(unique_keys);
              _.each(indexer, (d, i) => {
                t.index(d, i);
              });
            },
          );
        }
      })
      .catch(err => {
        console.log('[' + this.tableName, ': initialize error] ', err);
      });
  }

  private drop() {
    return BaseEntity.database.schema.dropTable(this.tableName);
  }

  clone(tableName: string) {
    return new BaseEntity(tableName, this.schema);
  }

  get query() {
    return BaseEntity.database<T>(this.tableName);
  }

  // table() {
  //   return
  // }

  // select(condition, selector) {
  //   var obj = this.database<T>(this.tableName);
  //   if (selector) obj = obj.select(this.database.raw(selector));
  //   else obj = obj.select("*");
  //   if (condition) obj = obj.where(condition);
  //   return obj;
  // }

  // getTable() {}

  // insert(row: T) {
  //   return this.database(this.tableName).insert(row);
  // }

  // delete(condition) {
  //   return this.database(this.tableName).where(condition).del();
  // }

  // batchInsert(rows: T[]) {
  //   return this.database.batchInsert(this.tableName, rows, 30);
  // }

  // update(condition, row) {
  //   return this.database(this.tableName).where(condition).update(row);
  // }

  // truncate() {
  //   return this.database(this.tableName).truncate();
  // }
}
