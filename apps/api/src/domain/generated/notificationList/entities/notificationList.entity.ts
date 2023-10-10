
import {Campaign} from '../../campaign/entities/campaign.entity'


export class NotificationList {
  id: string ;
campaignId: string ;
name: string  | null;
campaign?: Campaign ;
}
