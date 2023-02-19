
import {Campaign} from '../../campaign/entities/campaign.entity'


export class SlugArchive {
  id: string ;
slug: string ;
campaignId: string ;
campaign?: Campaign ;
}
