
import {AffiliateStatus} from '@prisma/client'
import {Company} from '../../company/entities/company.entity'


export class Affiliate {
  id: string ;
status: AffiliateStatus ;
affiliateCode: string  | null;
companyId: string  | null;
company?: Company  | null;
}
