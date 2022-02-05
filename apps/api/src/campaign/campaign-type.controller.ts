import { Controller, Get } from "@nestjs/common";
import { Public } from "nest-keycloak-connect";

import { CampaignService } from "./campaign.service";

@Controller("campaign-type")
export class CampaignTypeController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get("list")
  @Public()
  getData() {
    return this.campaignService.listCampaignTypes();
  }
}
