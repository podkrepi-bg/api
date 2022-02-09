import { Test, TestingModule } from "@nestjs/testing";

import { CampaignService } from "./campaign.service";
import { PrismaService } from "../prisma/prisma.service";
import { prismaMock } from "../prisma/prisma-client.mock";
import { CampaignController } from "./campaign.controller";

describe("CampaignController", () => {
  let controller: CampaignController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [
        CampaignService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
