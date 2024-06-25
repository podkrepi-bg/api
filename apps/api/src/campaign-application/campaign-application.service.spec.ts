import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationService } from './campaign-application.service'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { BadRequestException, HttpStatus } from '@nestjs/common'

describe('CampaignApplicationService', () => {
  let service: CampaignApplicationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignApplicationService],
    }).compile()

    service = module.get<CampaignApplicationService>(CampaignApplicationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createNewApplication', () => {
    const baseDto = {
      campaignName: 'Test Campaign',
      organizerName: 'Test Organizer',
      organizerEmail: 'organizer@example.com',
      organizerPhone: '123456789',
      beneficiary: 'Test Beneficiary',
      organizerBeneficiaryRel: 'Test Relation',
      goal: 'Test Goal',
      amount: '1000',
      toEntity: jest.fn(), // Mock implementation
    }
    it('should throw an error if acceptTermsAndConditions are not accepted', () => {
      const dto: CreateCampaignApplicationDto = {
        ...baseDto,
        acceptTermsAndConditions: false,
        transparencyTermsAccepted: true,
        personalInformationProcessingAccepted: true,
      }

      expect(() => service.create(dto)).toThrow(
        new BadRequestException('All agreements must be checked'),
      )
    })

    it('should throw an error if transparencyTermsAccepted  are not accepted', () => {
      const dto: CreateCampaignApplicationDto = {
        ...baseDto,
        acceptTermsAndConditions: true,
        transparencyTermsAccepted: false,
        personalInformationProcessingAccepted: true,
      }

      expect(() => service.create(dto)).toThrow(
        new BadRequestException('All agreements must be checked'),
      )
    })

    it('should throw an error if personalInformationProcessingAccepted is not accepted', () => {
      const dto: CreateCampaignApplicationDto = {
        ...baseDto,
        acceptTermsAndConditions: true,
        transparencyTermsAccepted: true,
        personalInformationProcessingAccepted: false,
      }

      expect(() => service.create(dto)).toThrow(
        new BadRequestException('All agreements must be checked'),
      )
    })

    it('should add a new campaign application if all agreements are accepted', () => {
      const dto: CreateCampaignApplicationDto = {
        ...baseDto,
        acceptTermsAndConditions: true,
        transparencyTermsAccepted: true,
        personalInformationProcessingAccepted: true,
      }

      expect(service.create(dto)).toBe('This action adds a new campaignApplication')
    })
  })
})
