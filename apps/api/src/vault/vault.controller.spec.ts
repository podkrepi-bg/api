import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { CampaignService } from '../campaign/campaign.service'
import { personServiceMock, PersonServiceMock } from '../person/mock/person.service.mock'
import { VaultController } from './vault.controller'
import { VaultService } from './vault.service'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { Currency } from '@prisma/client'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { CreateVaultDto } from './dto/create-vault.dto'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { MarketingNotificationsService } from '../notifications/notifications.service'
import { NotificationsProviderInterface } from '../notifications/providers/notifications.interface.providers'
import { SendGridNotificationsProvider } from '../notifications/providers/notifications.sendgrid.provider'

describe('VaultController', () => {
  let controller: VaultController
  let campaignService: CampaignService

  const vaultId = 'testVaultId'
  const userMock = {
    sub: 'testKeycloackId',
    resource_access: { account: { roles: [] } },
    'allowed-origins': [],
  } as KeycloakTokenParsed

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [VaultController],
      providers: [
        VaultService,
        {
          provide: CampaignService,
          useValue: {
            checkCampaignOwner: jest.fn(),
            getCampaignByVaultIdAndPersonId: jest.fn(() => ({})),
          },
        },
        MockPrismaService,
        PersonServiceMock,
        ConfigService,
        {
          // Use the interface as token
          provide: NotificationsProviderInterface,
          // But actually provide the service that implements the interface
          useClass: SendGridNotificationsProvider,
        },
        EmailService,
        TemplateService,
        MarketingNotificationsService,
      ],
    }).compile()

    controller = module.get<VaultController>(VaultController)
    campaignService = module.get<CampaignService>(CampaignService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should call create', async () => {
    const campaignId = 'testCampaignId'
    const data = {
      name: 'name',
      campaignId,
      currency: Currency.BGN,
      toEntity: new CreateVaultDto().toEntity,
    }

    await controller.create(userMock, data)

    expect(campaignService.checkCampaignOwner).toHaveBeenCalledWith(userMock.sub, campaignId)
    expect(prismaMock.vault.create).toHaveBeenCalled()
  })

  it('should not call create if user is not the owner', async () => {
    campaignService.checkCampaignOwner = jest.fn().mockRejectedValue(new UnauthorizedException())
    const campaignId = 'testCampaignId'
    const data = { name: 'name', campaignId, currency: Currency.BGN, toEntity: jest.fn() }

    await expect(controller.create(userMock, data)).rejects.toThrowError()
    expect(campaignService.checkCampaignOwner).toHaveBeenCalledWith(userMock.sub, campaignId)
    expect(prismaMock.vault.create).not.toHaveBeenCalled()
  })

  it('should call update', async () => {
    const data = { name: 'updated name' }

    await controller.update(userMock, vaultId, data)

    expect(personServiceMock.findOneByKeycloakId).toHaveBeenCalledWith(userMock.sub)
    expect(campaignService.getCampaignByVaultIdAndPersonId).toHaveBeenCalledWith(
      vaultId,
      'testPersonId',
    )
    expect(prismaMock.vault.update).toHaveBeenCalledWith({
      where: {
        id: vaultId,
      },
      data: {
        name: data.name,
      },
    })
  })

  it('should not call update if user is not owner', async () => {
    campaignService.getCampaignByVaultIdAndPersonId = jest.fn().mockReturnValue(undefined)
    const data = { name: 'updated name' }

    await expect(controller.update(userMock, vaultId, data)).rejects.toThrowError()
    expect(personServiceMock.findOneByKeycloakId).toHaveBeenCalledWith(userMock.sub)
    expect(campaignService.getCampaignByVaultIdAndPersonId).toHaveBeenCalledWith(
      vaultId,
      'testPersonId',
    )
    expect(prismaMock.vault.update).not.toHaveBeenCalled()
  })

  it('should call remove on empty vaults', async () => {
    prismaMock.vault.findFirst.mockResolvedValue({
      id: vaultId,
      name: 'vault1',
      currency: 'BGN',
      campaignId: '123',
      createdAt: new Date(),
      updatedAt: new Date(),
      amount: 0,
      blockedAmount: 0,
    })

    await controller.remove(userMock, vaultId)

    expect(personServiceMock.findOneByKeycloakId).toHaveBeenCalledWith(userMock.sub)
    expect(campaignService.getCampaignByVaultIdAndPersonId).toHaveBeenCalledWith(
      vaultId,
      'testPersonId',
    )
    expect(prismaMock.vault.delete).toHaveBeenCalledWith({
      where: {
        id: vaultId,
      },
    })
  })

  it('should not call remove on non-empty vaults', async () => {
    prismaMock.vault.findFirst.mockResolvedValue({
      id: vaultId,
      name: 'vault1',
      currency: 'BGN',
      campaignId: '123',
      createdAt: new Date(),
      updatedAt: new Date(),
      amount: 20,
      blockedAmount: 0,
    })

    await expect(controller.remove(userMock, vaultId)).rejects.toThrowError()

    expect(personServiceMock.findOneByKeycloakId).toHaveBeenCalledWith(userMock.sub)
    expect(campaignService.getCampaignByVaultIdAndPersonId).toHaveBeenCalledWith(
      vaultId,
      'testPersonId',
    )
    expect(prismaMock.vault.delete).not.toHaveBeenCalled()
  })

  it('should not call remove in user is not owner', async () => {
    campaignService.getCampaignByVaultIdAndPersonId = jest.fn().mockReturnValue(undefined)

    await expect(controller.remove(userMock, vaultId)).rejects.toThrowError()
    expect(personServiceMock.findOneByKeycloakId).toHaveBeenCalledWith(userMock.sub)
    expect(campaignService.getCampaignByVaultIdAndPersonId).toHaveBeenCalledWith(
      vaultId,
      'testPersonId',
    )
    expect(prismaMock.vault.delete).not.toHaveBeenCalled()
  })
})
