import { DataSource } from 'typeorm';
import { typeormConfig } from './typeorm.config.js';

export default new DataSource({
  ...(typeormConfig as any),
  entities: [],
  migrations: ['dist/database/migrations/*.js'],
});
