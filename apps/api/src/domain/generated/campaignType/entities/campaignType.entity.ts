
import {Campaign} from '../../campaign/entities/campaign.entity'


export class CampaignType {
  id: string ;
name: string ;
slug: string ;
description: string  | null;
parentId: string  | null;
parent?: CampaignType  | null;
children?: CampaignType[] ;
campaigns?: Campaign[] ;
}
