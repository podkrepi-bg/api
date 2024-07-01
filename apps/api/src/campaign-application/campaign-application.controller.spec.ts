import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationController } from './campaign-application.controller'
import { CampaignApplicationService } from './campaign-application.service'
import { SpyOf, autoSpy } from '@podkrepi-bg/testing'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { CampaignTypeCategory } from '@prisma/client'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { ForbiddenException, NotFoundException } from '@nestjs/common'

describe('CampaignApplicationController', () => {
  let controller: CampaignApplicationController
  let service: SpyOf<CampaignApplicationService>

  const mockNewCampaignApplication = {
    campaignName: 'TestCampaign',
    acceptTermsAndConditions: true,
    transparencyTermsAccepted: true,
    personalInformationProcessingAccepted: true,
    organizerName: 'Test',
    organizerEmail: 'testuser@gmail.com',
    organizerPhone: '123456789',
    beneficiary: 'testbeneficiary',
    organizerBeneficiaryRel: 'testorganizerBeneficiaryRel',
    goal: 'testgoal',
    history: 'testhistory',
    amount: '1000',
    description: 'testdescription',
    campaignGuarantee: 'testguarantee',
    otherFinanceSources: 'testotherFinanceSources',
    otherNotes: 'testotherNotes',
    category: CampaignTypeCategory.medical,
    toEntity: new CreateCampaignApplicationDto().toEntity,
  } as CreateCampaignApplicationDto

  const mockPerson = {
    exp: 1719781336,
    iat: 1719781036,
    jti: '57b3ed57-37e6-4248-897b-a653033d393f',
    iss: 'http://localhost:8180/auth/realms/webapp',
    aud: 'account',
    sub: '5f333fg3h-6970-1bc4-8v1b-0464ef99f2e5',
    typ: 'Bearer',
    azp: 'jwt-headless',
    session_state: 'a2250e3c-cced-4d44-8a39-afbd66898c49',
    'allowed-origins': ['*'],
    realm_access: { roles: ['default-roles-webapp', 'offline_access', 'uma_authorization'] },
    resource_access: {
      account: { roles: ['manage-account', 'manage-account-links', 'view-profile'] },
    },
    scope: 'openid profile email',
    sid: 'a2250e3c-cced-4d44-8a39-afbd66898c49',
    email_verified: 'true',
    name: 'Test User',
    preferred_username: 'testuser@gmail.com',
    given_name: 'Test',
    family_name: 'dfsUserUserf',
    email: 'testuser@gmail.com',
  } as KeycloakTokenParsed

  beforeEach(async () => {
    service = autoSpy(CampaignApplicationService)

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignApplicationController],
      providers: [{ provide: CampaignApplicationService, useValue: service }],
    }).compile()

    controller = module.get<CampaignApplicationController>(CampaignApplicationController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('when create called it should delegate to the service create', () => {
    // arrange
    // act
    controller.create(mockNewCampaignApplication, mockPerson)

    // assert
    expect(service.create).toHaveBeenCalledWith(mockNewCampaignApplication, mockPerson)
  })

  it('when create called with wrong user it should throw NotFoundException', async () => {
    // arrange
    // act
    controller.create(mockNewCampaignApplication, mockPerson)

    // assert
    await expect(
      controller.create.bind(controller, mockNewCampaignApplication, undefined),
    ).rejects.toThrow(new NotFoundException('No person found in database'))
  })
  it('when findAll called by a non-admin user it should throw a ForbiddenException', () => {
    // arrange
    const user = { sub: 'non-admin', 'allowed-origins': ['test'] } as KeycloakTokenParsed
    ;(isAdmin as jest.Mock).mockReturnValue(false)

    // act & assert
    expect(() => controller.findAll(user)).toThrow(ForbiddenException)
  })

  it('when findAll called by an admin user it should delegate to the service findAll', () => {
    // arrange
    const user = { sub: 'admin', 'allowed-origins': ['test'] } as KeycloakTokenParsed
    ;(isAdmin as jest.Mock).mockReturnValue(true)

    // act
    controller.findAll(user)

    // assert
    expect(service.findAll).toHaveBeenCalledWith()
  })

  it('when findOne called it should delegate to the service findOne', () => {
    // arrange
    // act
    controller.findOne('id')

    // assert
    expect(service.findOne).toHaveBeenCalledWith('id')
  })

  it('when update called it should delegate to the service update', () => {
    // arrange
    // act
    controller.update('1', {}, { sub: 'test', 'allowed-origins': ['test'] })

    // assert
    expect(service.update).toHaveBeenCalledWith('1', {})
  })
})
