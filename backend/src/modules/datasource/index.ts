import { app } from "electron";
import path from "path";
import knex, { Knex } from "knex";
import { BaseEntity } from "./BaseEntity";
import { DatasetEntity, DatasetFileEntity } from "./Entities";
import { LogEntity } from "@app/src/modules/datasource/Entities/LogEntity";

export type ClientMap = {
  "better-sqlite3": {
    filename: string;
  };
  mysql: {
    host: string;
    user: string;
    password: string;
    database: string;
  };
  pg: {
    host: string;
    user: string;
    password: string;
    database: string;
  };
};

interface DataConnectorOptions<K extends keyof ClientMap> {
  config: {
    client: K;
    connection: ClientMap[K];
  };
}

export class DataConnector {
  connected: boolean;
  database: Knex;
  private config: DataConnectorOptions<"better-sqlite3" | "pg">["config"];
  private entities: Record<string, BaseEntity<unknown>>;

  constructor(options?: DataConnectorOptions<"better-sqlite3" | "pg">) {
    this.connected = false;
    if (options) {
      this.config = options.config;
    }
  }

  async connect() {
    return await new Promise((resolve, reject) => {
      var timeoutId: NodeJS.Timeout;
      this.database = knex({
        client: this.config.client,
        connection: this.config.connection,
        pool: { min: 0, max: 10 },
        useNullAsDefault: true,
      });

      var ping = () => {
        clearTimeout(timeoutId);
        this.database
          .raw("select 1")
          .then((a) => {
            this.connected = true;
            resolve(this.database);
          })
          .catch((err) => {
            console.log(err);
            console.log("database is not running...");
            timeoutId = setTimeout(ping, 1000);
          });
      };
      ping();
    });
  }

  async initialize() {
    if (!this.connected) return;
    BaseEntity.database = this.database;
    const dataset = new DatasetEntity();
    const datasetFile = new DatasetFileEntity();
    const log = new LogEntity();

    await dataset.create();
    await datasetFile.create();
    await log.create();
  }

  entity<T>(tableName: string) {
    return this.entities[tableName] as BaseEntity<T>;
  }

  addEntity<T>(entity: BaseEntity<T>) {
    this.entities[entity.tableName] = entity;
  }
}
