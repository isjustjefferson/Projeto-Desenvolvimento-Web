import { TypeOrmModuleOptions } from '@nestjs/typeorm';

function buildConnectionOptions(): TypeOrmModuleOptions {
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      synchronize: false,
      autoLoadEntities: false,
      logging: process.env.NODE_ENV !== 'production',
      ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'predial',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'predial',
    synchronize: false,
    autoLoadEntities: false,
    logging: process.env.NODE_ENV !== 'production',
    ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false,
  };
}

export const typeormConfig = buildConnectionOptions();
