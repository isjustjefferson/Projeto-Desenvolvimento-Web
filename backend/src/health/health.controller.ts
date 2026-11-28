import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    @Optional()
    @InjectDataSource()
    private readonly dataSource?: DataSource,
  ) {}

  @Get()
  async check() {
    const base = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    if (!this.dataSource) {
      return {
        status: 'ok' as const,
        database: 'disabled' as const,
        ...base,
      };
    }

    let schemaPronto: boolean;
    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('DataSource not initialized');
      }
      const [schema] = await this.dataSource.query<{ sessoes: boolean; ocr: boolean }[]>(
        `SELECT to_regclass('public.sessoes_autenticacao') IS NOT NULL AS sessoes,
                to_regclass('public.trabalhos_ocr') IS NOT NULL AS ocr`,
      );
      schemaPronto = !!schema?.sessoes && !!schema.ocr;
    } catch {
      throw new HttpException(
        {
          status: 'error' as const,
          database: 'down' as const,
          ...base,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!schemaPronto) {
      throw new HttpException(
        { status: 'error', database: 'up', schema: 'incomplete', ...base },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { status: 'ok' as const, database: 'up' as const, ...base };
  }
}
