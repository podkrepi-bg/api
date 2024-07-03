import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationController } from './campaign-application.controller'
import { CampaignApplicationService } from './campaign-application.service'
import { SpyOf, autoSpy } from '@podkrepi-bg/testing'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { CampaignTypeCategory } from '@prisma/client'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { PersonService } from '../person/person.service'
import { mockUser, mockUserAdmin } from './../auth/__mocks__'

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
