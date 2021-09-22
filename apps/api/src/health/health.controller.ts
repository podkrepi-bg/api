import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Public, Resource, Scopes } from 'nest-keycloak-connect';
import { PrismaHealthIndicator } from '../prisma/prisma.health';

@Controller('health')
@Resource('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @Public()
  @Scopes()
  async check() {
    return await this.health.check([
      async () => this.prisma.isHealthy('database')
    ]);
  }
}
