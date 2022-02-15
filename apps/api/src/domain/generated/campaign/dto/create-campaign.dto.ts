





export class CreateCampaignDto {
  slug: string;
title: string;
essence: string;
beneficiaryId: string;
description?: string;
targetAmount?: number;
startDate?: Date;
endDate?: Date;
deletedAt?: Date;
}
