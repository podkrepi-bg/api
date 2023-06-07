
import {CampaignFileRole} from '@prisma/client'
import {CampaignNews} from '../../campaignNews/entities/campaignNews.entity'
import {Person} from '../../person/entities/person.entity'


export class CampaignNewsFile {
  id: string ;
filename: string ;
articleId: string ;
personId: string ;
mimetype: string ;
role: CampaignFileRole ;
news?: CampaignNews ;
person?: Person ;
}
