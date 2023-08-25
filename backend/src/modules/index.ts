import { app } from 'electron';
import path from 'path';
import { DataConnector } from './datasource';
import logger from './logger';
import { Logger } from 'winston';

export class ModuleManager {
  connector: DataConnector;
  logger: Logger;
  constructor() {}

  async initialize() {
    this.logger = logger;
    /*
    const dbPath = path.resolve(app.getAppPath(), '../app/frontend.db');
    {
        client: 'better-sqlite3',
        connection: {
          filename: dbPath,
        },
      }
    */

    /*
    const connector = new DataConnector({
      config: {
        client: 'pg',
        connection: {
          host: '127.0.0.1',
          user: 'admin',
          password: 'admin0228',
          database: 'saige_vision_developer',
        },
      },
    });

    await connector.connect();
    await connector.initialize();

    this.connector = connector;
    */
  }
}

export default new ModuleManager();
