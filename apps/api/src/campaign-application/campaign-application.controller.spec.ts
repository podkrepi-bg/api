import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationController } from './campaign-application.controller'
import { CampaignApplicationService } from './campaign-application.service'
import { SpyOf, autoSpy } from '@podkrepi-bg/testing'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { CampaignTypeCategory } from '@prisma/client'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { PersonService } from '../person/person.service'

describe('CampaignApplicationController', () => {
  let controller: CampaignApplicationController
  let service: CampaignApplicationService
  let personService: PersonService

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

  const mockUser = {
    exp: 1719866987,
    iat: 1719866687,
    jti: '607c488f-6e18-4455-8384-161cec4f1940',
    iss: 'http://localhost:8180/auth/realms/webapp',
    aud: 'account',
    sub: '5795ea9e-ac11-436b-b97d-7b03dbd863f2',
    typ: 'Bearer',
    azp: 'jwt-headless',
    session_state: 'def317ff-0043-4509-ade3-926dd155085e',
    'allowed-origins': ['*'],
    realm_access: { roles: ['default-roles-webapp', 'offline_access', 'uma_authorization'] },
    resource_access: {
      account: { roles: ['manage-account', 'manage-account-links', 'view-profile'] },
    },
    scope: 'openid profile email',
    sid: 'def317ff-0043-4509-ade3-926dd155085e',
    email_verified: 'true',
    name: 'asdasd sdfsdfsdfs',
    preferred_username: 'martbul01@gmail.com',
    given_name: 'asdasd',
    family_name: 'sdfsdfsdfs',
    email: 'martbul01@gmail.com',
  } as KeycloakTokenParsed

  const mockUserAdmin = {
    exp: 1719866987,
    iat: 1719866687,
    jti: '607c488f-6e18-4455-8384-161cec4f1940',
    iss: 'http://localhost:8180/auth/realms/webapp',
    aud: 'account',
    sub: '5795ea9e-ac11-436b-b97d-7b03dbd863f2',
    typ: 'Bearer',
    azp: 'jwt-headless',
    session_state: 'def317ff-0043-4509-ade3-926dd155085e',
    'allowed-origins': ['*'],
    realm_access: { roles: ['default-roles-webapp', 'offline_access', 'uma_authorization'] },
    resource_access: { account: { roles: ['manage-account', 'account-view-supporters'] } },
    scope: 'openid profile email',
    sid: 'def317ff-0043-4509-ade3-926dd155085e',
    email_verified: 'true',
    name: 'asdasd sdfsdfsdfs',
    preferred_username: 'martbul01@gmail.com',
    given_name: 'asdasd',
    family_name: 'sdfsdfsdfs',
    email: 'martbul01@gmail.com',
  } as KeycloakTokenParsed

  beforeEach(async () => {
    service = autoSpy(CampaignApplicationService)
    personService = autoSpy(PersonService)

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignApplicationController],
      providers: [
        { provide: CampaignApplicationService, useValue: service },
        { provide: PersonService, useValue: personService },
      ],
    }).compile()

    controller = module.get<CampaignApplicationController>(CampaignApplicationController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('when create called it should delegate to the service create', async () => {
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(null)

    // Act & Assert
    await expect(controller.create(mockNewCampaignApplication, mockUser)).rejects.toThrow(
      NotFoundException,
    )
  })

  it('when create called with wrong user it should throw NotFoundException', async () => {
    jest.mock('../auth/keycloak', () => ({
      isAdmin: jest.fn().mockReturnValue(false),
    }))

    await expect(controller.create(mockNewCampaignApplication, mockUser)).rejects.toThrow(
      NotFoundException,
    )
  })
  it('when findAll called by a non-admin user it should throw a ForbiddenException', () => {
    jest.mock('../auth/keycloak', () => ({
      isAdmin: jest.fn().mockReturnValue(false),
    }))

    // Arrange
    const user = { sub: 'non-admin', 'allowed-origins': ['test'] } as KeycloakTokenParsed

    // Act & Assert
    expect(() => controller.findAll(user)).toThrow(ForbiddenException)
  })
  it('when findAll called by an admin user it should delegate to the service findAll', () => {
    jest.mock('../auth/keycloak', () => ({
      isAdmin: jest.fn().mockImplementation((user: KeycloakTokenParsed) => {
        return user.resource_access?.account?.roles.includes('account-view-supporters')
      }),
    }))

    // Act & Assert
    expect(() => controller.findAll(mockUserAdmin)).not.toThrow(ForbiddenException)
    controller.findAll(mockUserAdmin)
    expect(service.findAll).toHaveBeenCalled()
  })

  it('when findOne called it should delegate to the service findOne', () => {
    // Act
    controller.findOne('id')

    // Assert
    expect(service.findOne).toHaveBeenCalledWith('id')
  })

  it('when update called it should delegate to the service update', () => {
    // Act
    controller.update('1', {}, { sub: 'test', 'allowed-origins': ['test'] })

    // Assert
    expect(service.update).toHaveBeenCalledWith('1', {})
  })
})
