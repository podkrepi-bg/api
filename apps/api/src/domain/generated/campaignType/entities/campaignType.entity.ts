
import {Campaign} from '../../campaign/entities/campaign.entity'


export class CampaignType {
  id: string ;
name: string ;
slug: string ;
description: string  | null;
parentId: string  | null;
campaigns?: Campaign[] ;
}
