
import {EmailType} from '@prisma/client'


export class EmailSentRegistry {
  id: string ;
email: string ;
dateSent: Date ;
campaignId: string  | null;
type: EmailType ;
}
