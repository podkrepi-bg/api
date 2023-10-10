
import {CampaignNewsState} from '@prisma/client'
import {Campaign} from '../../campaign/entities/campaign.entity'
import {Person} from '../../person/entities/person.entity'
import {CampaignNewsFile} from '../../campaignNewsFile/entities/campaignNewsFile.entity'


export class CampaignNews {
  id: string ;
campaignId: string ;
publisherId: string ;
slug: string ;
title: string ;
author: string ;
sourceLink: string  | null;
state: CampaignNewsState ;
createdAt: Date ;
publishedAt: Date  | null;
editedAt: Date  | null;
description: string ;
campaign?: Campaign ;
publisher?: Person ;
newsFiles?: CampaignNewsFile[] ;
}
