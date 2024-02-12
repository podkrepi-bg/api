import { AffiliateStatus } from '@prisma/client'
import { Company } from '../../company/entities/company.entity'
import { Payments } from '../../payments/entities/payments.entity'

export class Affiliate {
  id: string
  status: AffiliateStatus
  affiliateCode: string | null
  companyId: string
  createdAt: Date
  updatedAt: Date | null
  company?: Company
  payments?: Payments[]
}
