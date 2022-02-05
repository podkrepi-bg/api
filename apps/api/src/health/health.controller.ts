import { Public } from "nest-keycloak-connect";
import { Controller, Get } from "@nestjs/common";
import { HealthCheckService, HealthCheck } from "@nestjs/terminus";

import { PrismaHealthIndicator } from "../prisma/prisma.health";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealthIndicator: PrismaHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  @Public()
  async check() {
    return await this.health.check([
      async () => this.prismaHealthIndicator.isHealthy("database"),
    ]);
  }
}
