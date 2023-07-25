import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { PersonService } from '../person/person.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { VaultModule } from '../vault/vault.module'
import { VaultService } from '../vault/vault.service'
import { CampaignService } from './campaign.service'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { CampaignState, Currency } from '@prisma/client'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'
import { NotificationsInterface } from '../notifications/notifications.interface'

describe('CampaignService', () => {
  let service: CampaignService
  let marketing: NotificationsInterface<any>

  const mockCreateCampaign = {
    slug: 'test-slug',
    title: 'Test name',
    description: 'Test description',
    essence: 'test',
    coordinatorId: 'testCoordinatorId',
    beneficiaryId: 'testBeneficiaryId',
    organizerId: 'testOrganizerId',
    companyId: 'testCompanyId',
    campaignTypeId: 'testCampaignTypeId',
    targetAmount: 1000,
    reachedAmount: 0,
    startDate: null,
    endDate: null,
    currency: Currency.BGN,
    toEntity: new CreateCampaignDto().toEntity,
  } as CreateCampaignDto

  const paymentReferenceMock = 'NY5P-KVO4-DNBZ'
  const mockCampaign = {
    ...mockCreateCampaign,
    ...{
      id: 'testId',
      state: CampaignState.draft,
      createdAt: new Date('2022-04-08T06:36:33.661Z'),
      updatedAt: new Date('2022-04-08T06:36:33.662Z'),
      deletedAt: null,
      approvedById: null,
      beneficiary: { person: { keycloakId: 'some-id' } },
      coordinator: { person: { keycloakId: 'some-id' } },
      organizer: { person: { keycloakId: 'some-id' } },
      campaignFiles: [],
      paymentReference: paymentReferenceMock,
      vaults: [],
      notificationLists: [],
    },
  }

  const mockUpdateCampaign = {
    ...mockCreateCampaign,
    ...{
      id: 'testId',
      state: CampaignState.approved,
      createdAt: new Date('2022-04-08T06:36:33.661Z'),
      updatedAt: new Date('2022-04-08T06:36:33.662Z'),
      deletedAt: null,
      approvedById: null,
      beneficiary: { person: { keycloakId: 'testBeneficiaryKeycloakId' } },
      coordinator: { person: { keycloakId: 'testCoordinatorKeycloakId' } },
      organizer: { person: { keycloakId: 'testOrganizerKeycloakId' } },
      company: { person: { keycloakId: 'testCompanyKeycloakId' } },
      campaignFiles: [],
      paymentReference: paymentReferenceMock,
      vaults: [],
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NotificationModule, MarketingNotificationsModule],
      providers: [
        VaultService,
        CampaignService,
        MockPrismaService,
        VaultService,
        PersonService,
        ConfigService,
      ],
    }).compile()

    service = module.get<CampaignService>(CampaignService)
    marketing = module.get<NotificationsInterface<any>>(NotificationsInterface)
  })

  describe('update', () => {
    it('should create notification list, first time campaign state is updated to active', async () => {
      const updateData: UpdateCampaignDto = {
        state: CampaignState.active,
      }

      // Return updated data
      const updatedCampaign = { ...mockCampaign, ...updateData }
      prismaMock.campaign.update.mockResolvedValue(updatedCampaign)

      jest.spyOn(marketing, 'createNewContactList').mockImplementation(async () => 'list-id')
      jest.spyOn(marketing, 'updateContactList').mockImplementation(async () => '')
      jest.spyOn(service, 'createCampaignNotificationList')

      expect(await service.update(mockUpdateCampaign.id, updateData, mockCampaign)).toEqual(
        updatedCampaign,
      )

      expect(prismaMock.campaign.update).toHaveBeenCalledWith({
        where: { id: mockCampaign.id },
        data: updateData,
      })
      expect(service.createCampaignNotificationList).toHaveBeenCalledWith(updatedCampaign)
      expect(marketing.createNewContactList).toHaveBeenCalledWith({
        name: updatedCampaign.title,
      })
      expect(prismaMock.notificationList.create).toHaveBeenCalledWith({
        data: {
          id: 'list-id',
          campaignId: updatedCampaign.id,
          name: updatedCampaign.title,
        },
      })
      // Since there was no notification list for this campaign previously
      // Should not be called
      expect(marketing.updateContactList).not.toHaveBeenCalled()
    })

    it('should update existing notification list name, if active campaign name is updated', async () => {
      const updateData: UpdateCampaignDto = {
        state: CampaignState.active,
        title: 'New Campaign Title',
      }

      // Return updated data
      const campaignWithList = {
        ...mockCampaign,
        notificationLists: [
          {
            id: 'campaign-list-id',
            name: 'camapign-name',
            campaignId: mockCampaign.id,
          },
        ],
      }
      const updatedCampaign = { ...mockCampaign, ...updateData }

      prismaMock.campaign.update.mockResolvedValue(updatedCampaign)

      jest.spyOn(marketing, 'createNewContactList').mockImplementation(async () => '')
      jest.spyOn(marketing, 'updateContactList').mockImplementation(async () => '')
      jest.spyOn(service, 'createCampaignNotificationList')
      jest.spyOn(service, 'updateCampaignNotificationList')

      expect(await service.update(campaignWithList.id, updateData, campaignWithList)).toEqual(
        updatedCampaign,
      )

      expect(prismaMock.campaign.update).toHaveBeenCalledWith({
        where: { id: campaignWithList.id },
        data: updateData,
      })
      // Since notification list exists  for this campaign
      expect(service.createCampaignNotificationList).not.toHaveBeenCalled()
      // Should be called
      expect(service.updateCampaignNotificationList).toHaveBeenCalledWith(
        updatedCampaign,
        campaignWithList.notificationLists[0],
      )
      expect(marketing.updateContactList).toHaveBeenCalledWith({
        data: { name: updatedCampaign.title },
        id: campaignWithList.notificationLists[0].id,
      })
      expect(prismaMock.notificationList.update).toHaveBeenCalledWith({
        where: { id: campaignWithList.notificationLists[0].id },
        data: {
          name: updatedCampaign.title,
        },
      })
    })
  })
})
