import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AnexoDespesaEntity } from './entities/anexo-despesa.entity.js';
import { ChamadoEntity } from './entities/chamado.entity.js';
import { DespesaEntity } from './entities/despesa.entity.js';
import { HistoricoEntity } from './entities/historico.entity.js';
import { LocalEntity } from './entities/local.entity.js';
import { TokenResetEntity } from './entities/token-reset.entity.js';
import { UsuarioEntity } from './entities/usuario.entity.js';

function parseEnvText(text: string): void {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (const rawLine of clean.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function loadEnvFile(): void {
  if (process.env.NODE_ENV === 'test' || !!process.env.VITEST) return;
  const candidates = [resolve(process.cwd(), '.env'), resolve(process.cwd(), 'backend', '.env')];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      parseEnvText(readFileSync(file, 'utf8'));
    } catch {
      // ignore; env may already be set
    }
  }
}

loadEnvFile();

function sslRequired(): boolean {
  const v = (process.env.DB_SSL ?? '').toLowerCase();
  return v === 'require' || v === 'true' || v === '1' || v === 'yes';
}

function buildSslOptions(): false | { rejectUnauthorized: boolean } {
  if (!sslRequired()) return false;
  // Managed Postgres (Supabase/Neon/etc.) usually requires SSL.
  // rejectUnauthorized can be tightened if you provide the provider CA.
  return { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' };
}

function buildConnectionOptions(): TypeOrmModuleOptions {
  const ssl = buildSslOptions();
  const entities = [
    UsuarioEntity,
    LocalEntity,
    ChamadoEntity,
    HistoricoEntity,
    TokenResetEntity,
    DespesaEntity,
    AnexoDespesaEntity,
  ];
  const base: TypeOrmModuleOptions = {
    type: 'postgres',
    synchronize: false,
    autoLoadEntities: false,
    entities,
    logging: false,
    retryAttempts: 0,
    retryDelay: 3000,
    ...(ssl ? { ssl, extra: { ssl } } : {}),
  };

  if (process.env.DATABASE_URL) {
    return {
      ...base,
      url: process.env.DATABASE_URL,
    };
  }

  return {
    ...base,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'predial',
    password: process.env.DB_PASSWORD ?? undefined,
    database: process.env.DB_NAME ?? 'predial',
  };
}

export const typeormConfig = buildConnectionOptions();
