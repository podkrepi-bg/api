import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationController } from './campaign-application.controller'
import { CampaignApplicationService } from './campaign-application.service'
import { autoSpy } from '@podkrepi-bg/testing'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { PersonService } from '../person/person.service'
import { mockUser, mockUserAdmin } from './../auth/__mocks__'
import {
  mockNewCampaignApplication,
  mockUpdateCampaignApplication,
} from './__mocks__/campaign-application-mocks'
import { mockCampaignApplicationFilesFn } from './__mocks__/campaing-application-file-mocks'
import { personMock } from '../person/__mock__/personMock'

describe('CampaignApplicationController', () => {
  let controller: CampaignApplicationController
  let service: CampaignApplicationService
  let personService: PersonService

  const mockPerson = {
    ...personMock,
    company: null,
    beneficiaries: [],
    organizer: { id: 'personOrganaizerId' },
  }

  const mockCreateNewCampaignApplication = {
    ...mockNewCampaignApplication,
    acceptTermsAndConditions: true,
    transparencyTermsAccepted: true,
    personalInformationProcessingAccepted: true,
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
    // Arrange
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(mockUser)

    // Act
    await controller.create(mockCreateNewCampaignApplication, mockUser)

    // Assert
    expect(service.create).toHaveBeenCalledWith(mockCreateNewCampaignApplication, mockUser)
  })

  it('when create called with wrong user it should throw NotFoundException', async () => {
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(null)

    // Act & Assert
    await expect(controller.create(mockCreateNewCampaignApplication, mockUser)).rejects.toThrow(
      NotFoundException,
    )
  })

  it('when uploadFile/:id called it should delegate to the service uploadFiles', async () => {
    // Arrange
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(mockUser)
    const mockCampaignApplicationFiles = mockCampaignApplicationFilesFn()

    // Act
    await controller.uploadFiles(mockCampaignApplicationFiles, 'newCampaignApplicationId', mockUser)

    // Assert
    expect(service.uploadFiles).toHaveBeenCalledWith(
      'newCampaignApplicationId',
      mockUser,
      mockCampaignApplicationFiles,
    )
  })

  it('when uploadFile/:id called  with wrong user it should throw NotFoundException', async () => {
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(null)
    const mockCampaignApplicationFiles = mockCampaignApplicationFilesFn()

    // Act & Assert
    await expect(
      controller.uploadFiles(mockCampaignApplicationFiles, 'newCampaignApplicationId', mockUser),
    ).rejects.toThrow(NotFoundException)
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

  it('when findOne is called by an organizer, it should delegate to the service findOne', async () => {
    // Arrange
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(mockUser)

    jest.mock('../auth/keycloak', () => ({
      isAdmin: jest.fn().mockReturnValue(false),
    }))

    // Act
    await controller.findOne('id', mockUser)

    // Assert
    expect(personService.findOneByKeycloakId).toHaveBeenCalledWith(mockUser.sub)
    expect(service.findOne).toHaveBeenCalledWith('id', false, mockUser)
  })

  it('when findOne is called by an admin user, it should delegate to the service with isAdmin true', async () => {
    // Arrange
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(mockUserAdmin)
    jest.mock('../auth/keycloak', () => ({
      isAdmin: jest.fn().mockReturnValue(true),
    }))

    // Act
    await controller.findOne('id', mockUserAdmin)

    // Assert
    expect(personService.findOneByKeycloakId).toHaveBeenCalledWith(mockUserAdmin.sub)
    expect(service.findOne).toHaveBeenCalledWith('id', true, mockUserAdmin)
  })

  it('when update called by an user it should delegate to the service update', async () => {
    // Arrange
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(mockPerson)

    // Act
    await controller.update('campaignApplicationId', mockUpdateCampaignApplication, mockUser)

    // Assert
    expect(service.updateCampaignApplication).toHaveBeenCalledWith(
      'campaignApplicationId',
      mockUpdateCampaignApplication,
      false,
      'personOrganaizerId',
    )
  })

  it('when update called by an admin it should delegate to the service update with isAdminFlag true', async () => {
    // Arrange
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(mockPerson)
    jest.spyOn(service, 'updateCampaignApplication').mockImplementation(async () => {})

    // Act
    await controller.update('campaignApplicationId', mockUpdateCampaignApplication, mockUserAdmin)

    // Assert
    expect(service.updateCampaignApplication).toHaveBeenCalledWith(
      'campaignApplicationId',
      mockUpdateCampaignApplication,
      true,
      'ADMIN',
    )
  })
})
