import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { UpdateCampaignApplicationDto } from './dto/update-campaign-application.dto'
import { PrismaService } from '../prisma/prisma.service'
import { OrganizerService } from '../organizer/organizer.service'
import { Person } from '@prisma/client'

@Injectable()
export class CampaignApplicationService {
  constructor(private prisma: PrismaService, private organizerService: OrganizerService) {}
  async getCampaignByIdWithPersonIds(id: string): Promise<UpdateCampaignApplicationDto> {
    throw new Error('Method not implemented.')
  }

  async create(createCampaignApplicationDto: CreateCampaignApplicationDto, person: Person) {
    try {
      if (
        createCampaignApplicationDto.acceptTermsAndConditions === false ||
        createCampaignApplicationDto.transparencyTermsAccepted === false ||
        createCampaignApplicationDto.personalInformationProcessingAccepted === false
      ) {
        throw new BadRequestException('All agreements must be checked')
      }

      let organizer = await this.prisma.organizer.findUnique({
        where: { personId: person.id },
      })

      if (!organizer) {
        organizer = await this.organizerService.create({
          personId: person.id,
        })
      }

      const sanitizedData = {
        campaignName: createCampaignApplicationDto.campaignName.trim(),
        organizerName: createCampaignApplicationDto.organizerName.trim(),
        organizerEmail: createCampaignApplicationDto.organizerEmail.trim(),
        organizerPhone: createCampaignApplicationDto.organizerPhone.trim(),
        beneficiary: createCampaignApplicationDto.beneficiary.trim(),
        organizerBeneficiaryRel: createCampaignApplicationDto.organizerBeneficiaryRel.trim(),
        goal: createCampaignApplicationDto.goal.trim(),
        history: createCampaignApplicationDto.history?.trim(),
        amount: createCampaignApplicationDto.amount.trim(),
        description: createCampaignApplicationDto.description?.trim(),
        campaignGuarantee: createCampaignApplicationDto.campaignGuarantee?.trim(),
        otherFinanceSources: createCampaignApplicationDto.otherFinanceSources?.trim(),
        otherNotes: createCampaignApplicationDto.otherNotes?.trim(),
        category: createCampaignApplicationDto.category,
        organizerId: organizer.id,
      }

      const newCampaignApplication = await this.prisma.campaignApplication.create({
        data: sanitizedData,
      })

      return newCampaignApplication
    } catch (error) {
      console.error('Error in create():', error)
      throw error
    }
  }

  findAll() {
    return this.prisma.campaignApplication.findMany()
  }

  findOne(id: string) {
    return `This action returns a #${id} campaignApplication`
  }

  update(id: string, updateCampaignApplicationDto: UpdateCampaignApplicationDto) {
    return `This action updates a #${id} campaignApplication`
  }

  remove(id: string) {
    return `This action removes a #${id} campaignApplication`
  }
}
