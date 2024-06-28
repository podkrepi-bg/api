import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationController } from './campaign-application.controller'
import { CampaignApplicationService } from './campaign-application.service'
import { SpyOf, autoSpy } from '@podkrepi-bg/testing'
import { ForbiddenException } from '@nestjs/common'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'

jest.mock('../auth/keycloak')

describe('CampaignApplicationController', () => {
  let controller: CampaignApplicationController
  let service: SpyOf<CampaignApplicationService>

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
    controller.create({
      acceptTermsAndConditions: true,
      personalInformationProcessingAccepted: true,
      transparencyTermsAccepted: true,
      title: 'new ',
      toEntity: jest.fn(),
    })

    // assert
    expect(service.create).toHaveBeenCalledWith({
      acceptTermsAndConditions: true,
      personalInformationProcessingAccepted: true,
      transparencyTermsAccepted: true,
      title: 'new ',
      toEntity: expect.any(Function),
    })
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
