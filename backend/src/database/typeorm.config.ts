import { TypeOrmModuleOptions } from '@nestjs/typeorm';

function buildConnectionOptions(): TypeOrmModuleOptions {
  const base: TypeOrmModuleOptions = {
    type: 'postgres',
    synchronize: false,
    autoLoadEntities: false,
    logging: false,
    retryAttempts: 0,
    retryDelay: 3000,
  };

  if (process.env.DATABASE_URL) {
    return {
      ...base,
      url: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    ...base,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'predial',
    password: process.env.DB_PASSWORD ?? undefined,
    database: process.env.DB_NAME ?? 'predial',
    ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false,
  };
}

export const typeormConfig = buildConnectionOptions();
