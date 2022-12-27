
import {IrregularityStatus,IrregularityReason,NotifierType} from '@prisma/client'
import {Campaign} from '../../campaign/entities/campaign.entity'
import {Person} from '../../person/entities/person.entity'
import {IrregularityFile} from '../../irregularityFile/entities/irregularityFile.entity'


export class Irregularity {
  id: string ;
campaignId: string ;
personId: string ;
createdAt: Date ;
updatedAt: Date  | null;
status: IrregularityStatus ;
reason: IrregularityReason ;
description: string ;
notifierType: NotifierType ;
campaign?: Campaign ;
person?: Person ;
files?: IrregularityFile[] ;
}
