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

    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('DataSource not initialized');
      }
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok' as const,
        database: 'up' as const,
        ...base,
      };
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
  }
}
