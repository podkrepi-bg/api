import { Prisma } from '@prisma/client'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

import { GroupBy } from './dto/group-by.dto'
import {
  GroupedDonationsDto,
  HourlyDonationsDto,
  UniqueDonationsDto,
} from './dto/donation-statistics.dto'

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async listGroupedDonations(
    campaignId: string,
    groupBy?: GroupBy,
  ): Promise<GroupedDonationsDto[]> {
    const date =
      groupBy === GroupBy.MONTH
        ? Prisma.sql`DATE_TRUNC('MONTH', created_at) date`
        : groupBy === GroupBy.WEEK
        ? Prisma.sql`DATE_TRUNC('WEEK', created_at) date`
        : Prisma.sql`DATE_TRUNC('DAY', created_at) date`

    const group =
      groupBy === GroupBy.MONTH
        ? Prisma.sql`GROUP BY DATE_TRUNC('MONTH', created_at)`
        : groupBy === GroupBy.WEEK
        ? Prisma.sql`GROUP BY DATE_TRUNC('WEEK', created_at)`
        : Prisma.sql`GROUP BY DATE_TRUNC('DAY', created_at)`

    return this.prisma.$queryRaw`
    SELECT SUM(amount)::INTEGER, COUNT(id)::INTEGER, ${date}
    FROM api.donations WHERE status = 'succeeded'
    ${Prisma.sql`AND target_vault_id IN ( SELECT id from api.vaults WHERE campaign_id = ${campaignId}::uuid)`}
    ${group}
    ORDER BY date ASC `
  }

  async listUniqueDonations(campaignId: string): Promise<UniqueDonationsDto[]> {
    return this.prisma.$queryRaw`
    SELECT amount::INTEGER, COUNT(id)::INTEGER AS count
    FROM api.donations WHERE status = 'succeeded'
    ${Prisma.sql`AND target_vault_id IN ( SELECT id from api.vaults WHERE campaign_id = ${campaignId}::uuid)`}
    GROUP BY amount
    ORDER BY amount ASC`
  }

  async listHourlyDonations(campaignId: string): Promise<HourlyDonationsDto[]> {
    return this.prisma.$queryRaw`
    SELECT EXTRACT(HOUR from created_at)::INTEGER AS hour, COUNT(id)::INTEGER AS count
    FROM api.donations where status = 'succeeded'
    ${Prisma.sql`AND target_vault_id IN ( SELECT id from api.vaults WHERE campaign_id = ${campaignId}::uuid)`}
    GROUP BY hour
    ORDER BY hour ASC`
  }
}
