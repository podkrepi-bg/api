
import {Campaign} from '../../campaign/entities/campaign.entity'
import {Person} from '../../person/entities/person.entity'
import {Donation} from '../../donation/entities/donation.entity'


export class DonationWish {
  id: string ;
message: string ;
campaignId: string ;
personId: string  | null;
donationId: string  | null;
createdAt: Date ;
updatedAt: Date  | null;
campaign?: Campaign ;
person?: Person  | null;
donation?: Donation  | null;
}
