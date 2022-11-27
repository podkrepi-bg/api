import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SupportService } from '../support/support.service'

@Injectable()
export class CampaignReportService {
  constructor(private prisma: PrismaService) {}

  
}