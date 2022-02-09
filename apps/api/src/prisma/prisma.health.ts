import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(
    private prisma: PrismaService,
  ) {
    super()
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return this.getStatus(
        key, true, { message: 'Successful connection to the database established.' })
    }
    catch (ex) {
      throw new HealthCheckError('Connection to the database could not be established.', ex);
    }
  }
}
