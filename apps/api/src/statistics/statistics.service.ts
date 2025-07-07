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
        ? Prisma.sql`DATE_TRUNC('MONTH', d.created_at) date`
        : groupBy === GroupBy.WEEK
        ? Prisma.sql`DATE_TRUNC('WEEK', d.created_at) date`
        : Prisma.sql`DATE_TRUNC('DAY', d.created_at) date`

    const group =
      groupBy === GroupBy.MONTH
        ? Prisma.sql`GROUP BY DATE_TRUNC('MONTH', d.created_at)`
        : groupBy === GroupBy.WEEK
        ? Prisma.sql`GROUP BY DATE_TRUNC('WEEK', d.created_at)`
        : Prisma.sql`GROUP BY DATE_TRUNC('DAY', d.created_at)`

    return this.prisma.$queryRaw`
    SELECT SUM(d.amount)::INTEGER, COUNT(d.id)::INTEGER, ${date}
    FROM api.donations d, api.payments p WHERE p.status::text = 'succeeded'
    ${Prisma.sql`AND target_vault_id IN ( SELECT id from api.vaults WHERE campaign_id = ${campaignId}::uuid)`}
    ${group}
    ORDER BY date ASC `
  }

  async listUniqueDonations(campaignId: string): Promise<UniqueDonationsDto[]> {
    return this.prisma.$queryRaw`
    SELECT d.amount::INTEGER, COUNT(d.id)::INTEGER AS count
    FROM api.donations d, api.payments p WHERE p.status::text = 'succeeded'
    ${Prisma.sql`AND target_vault_id IN ( SELECT id from api.vaults WHERE campaign_id = ${campaignId}::uuid)`}
    GROUP BY d.amount
    ORDER BY amount ASC`
  }

  async listHourlyDonations(campaignId: string): Promise<HourlyDonationsDto[]> {
    return this.prisma.$queryRaw`
    SELECT EXTRACT(HOUR from d.created_at)::INTEGER AS hour, COUNT(d.id)::INTEGER AS count
    FROM api.donations d, api.payments p WHERE p.status::text = 'succeeded'
    ${Prisma.sql`AND target_vault_id IN ( SELECT id from api.vaults WHERE campaign_id = ${campaignId}::uuid)`}
    GROUP BY hour
    ORDER BY hour ASC`
  }
}
