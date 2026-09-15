import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok' as const,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}