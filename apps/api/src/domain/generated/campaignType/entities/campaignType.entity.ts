
import {CampaignTypeCategory} from '@prisma/client'
import {Campaign} from '../../campaign/entities/campaign.entity'


export class CampaignType {
  id: string ;
name: string ;
slug: string ;
description: string  | null;
parentId: string  | null;
category: CampaignTypeCategory ;
parent?: CampaignType  | null;
children?: CampaignType[] ;
campaigns?: Campaign[] ;
}
