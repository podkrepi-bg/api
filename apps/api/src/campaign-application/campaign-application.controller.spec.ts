import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationController } from './campaign-application.controller'
import { CampaignApplicationService } from './campaign-application.service'
import { SpyOf, autoSpy } from '@podkrepi-bg/testing'

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

  it('when findAll called it should delegate to the service findAll', () => {
    // arrange
    // act
    controller.findAll()

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
