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

    const result = await this.prisma.$queryRaw`
    SELECT COALESCE(SUM(d.amount), 0)::NUMERIC as sum, COUNT(d.id)::INTEGER as count, ${date}
    FROM api.donations d
    INNER JOIN api.payments p ON p.id = d.payment_id
    WHERE p.status::text = 'succeeded'
    ${Prisma.sql`AND d.target_vault_id IN ( SELECT id from api.vaults WHERE campaign_id = ${campaignId}::uuid)`}
    ${group}
    ORDER BY date ASC `

    return (result as GroupedDonationsDto[]).map((row) => ({
      sum: Number(row.sum),
      count: Number(row.count),
      date: new Date(row.date),
    }))
  }

  async listUniqueDonations(campaignId: string): Promise<UniqueDonationsDto[]> {
    const result = await this.prisma.$queryRaw`
    SELECT d.amount::INTEGER as amount, COUNT(d.id)::INTEGER AS count
    FROM api.donations d
    INNER JOIN api.payments p ON p.id = d.payment_id
    WHERE p.status::text = 'succeeded'
    ${Prisma.sql`AND d.target_vault_id IN ( SELECT id from api.vaults WHERE campaign_id = ${campaignId}::uuid)`}
    GROUP BY d.amount
    ORDER BY amount ASC`
    return (result as UniqueDonationsDto[]).map((row) => ({
      amount: Number(row.amount),
      count: Number(row.count),
    }))
  }

  async listHourlyDonations(campaignId: string): Promise<HourlyDonationsDto[]> {
    const result = await this.prisma.$queryRaw`
    SELECT EXTRACT(HOUR from d.created_at)::INTEGER AS hour, COUNT(d.id)::INTEGER AS count
    FROM api.donations d
    INNER JOIN api.payments p ON p.id = d.payment_id
    WHERE p.status::text = 'succeeded'
    ${Prisma.sql`AND d.target_vault_id IN ( SELECT id from api.vaults WHERE campaign_id = ${campaignId}::uuid)`}
    GROUP BY hour
    ORDER BY hour ASC`
    
    return (result as HourlyDonationsDto[]).map((row) => ({
      hour: Number(row.hour),
      count: Number(row.count),
    }))
  }
}
