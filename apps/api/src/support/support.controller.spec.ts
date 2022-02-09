import { InfoRequest, PrismaPromise, Supporter } from ".prisma/client";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { EmailService } from "../email/email.service";
import { TemplateService } from "../email/template.service";

import { prismaMock } from "../prisma/prisma-client.mock";
import { PrismaService } from "../prisma/prisma.service";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";

describe("SupportController", () => {
  let controller: SupportController;
  let prismaService: PrismaService;

  beforeEach(() => {
    prismaService = prismaMock;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        SupportService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        EmailService,
        TemplateService,
        ConfigService,
      ],
    }).compile();

    controller = module.get<SupportController>(SupportController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getSuporters", () => {
    it("should list all supporters in db", async () => {
      const expected: Supporter[] = [
        {
          id: "844a5fbc-34a4-4cb5-b3ee-8b8ddef106aa",
          personId: "ec0c7e93-baae-497e-b62b-5b7f134bda22",
          createdAt: new Date("2021-10-11T21:40:47.371Z"),
          updatedAt: new Date("2021-10-11T21:40:47.371Z"),
          deletedAt: null,
          comment: "test",
          associationMember: true,
          benefactorCampaign: false,
          benefactorPlatform: false,
          companyOtherText: "",
          companySponsor: false,
          companyVolunteer: false,
          partnerBussiness: false,
          partnerNpo: false,
          partnerOtherText: "",
          roleAssociationMember: true,
          roleBenefactor: false,
          roleCompany: false,
          rolePartner: false,
          roleVolunteer: false,
          volunteerBackend: false,
          volunteerDesigner: false,
          volunteerDevOps: false,
          volunteerFinancesAndAccounts: false,
          volunteerFrontend: false,
          volunteerLawyer: false,
          volunteerMarketing: false,
          volunteerProjectManager: false,
          volunteerQa: false,
          volunteerSecurity: false,
        },
        {
          id: "166cf75e-ecf7-4585-af24-f9f31eb47bab",
          personId: "ec0c7e93-baae-497e-b62b-5b7f134bda22",
          createdAt: new Date("2021-10-11T21:41:31.388Z"),
          updatedAt: new Date("2021-10-11T21:41:31.388Z"),
          deletedAt: null,
          comment: "test",
          associationMember: true,
          benefactorCampaign: false,
          benefactorPlatform: false,
          companyOtherText: "",
          companySponsor: false,
          companyVolunteer: false,
          partnerBussiness: false,
          partnerNpo: false,
          partnerOtherText: "",
          roleAssociationMember: true,
          roleBenefactor: false,
          roleCompany: false,
          rolePartner: false,
          roleVolunteer: false,
          volunteerBackend: false,
          volunteerDesigner: false,
          volunteerDevOps: false,
          volunteerFinancesAndAccounts: false,
          volunteerFrontend: false,
          volunteerLawyer: false,
          volunteerMarketing: false,
          volunteerProjectManager: false,
          volunteerQa: false,
          volunteerSecurity: false,
        },
      ];

      const mockList = jest
        .fn<PrismaPromise<Supporter[]>, []>()
        .mockResolvedValue(expected);

      jest
        .spyOn(prismaService.supporter, "findMany")
        .mockImplementation(mockList);

      expect(await controller.getSuporters()).toIncludeSameMembers(expected);
    });
  });

  describe("getInfoRequests", () => {
    it("should list all info requests in db", async () => {
      const expected: InfoRequest[] = [
        {
          id: "d100c751-d42a-465b-a436-6fc62cfccc5d",
          personId: "ec0c7e93-baae-497e-b62b-5b7f134bda22",
          message: "rest rest rest",
          createdAt: new Date("2021-10-11T22:01:18.997Z"),
          updatedAt: new Date("2021-10-11T22:01:18.997Z"),
          deletedAt: null,
        },
        {
          id: "0930f046-546a-4397-9dc2-c62d54d6e367",
          personId: "7c07dbdf-9f7d-4496-9edf-a1067229c602",
          message: "nest nest nest",
          createdAt: new Date("2021-10-11T22:09:25.444Z"),
          updatedAt: new Date("2021-10-11T22:09:25.445Z"),
          deletedAt: null,
        },
      ];

      const mockList = jest
        .fn<PrismaPromise<InfoRequest[]>, []>()
        .mockResolvedValue(expected);

      jest
        .spyOn(prismaService.infoRequest, "findMany")
        .mockImplementation(mockList);

      expect(await controller.getInfoRequests()).toIncludeSameMembers(expected);
    });
  });
});
