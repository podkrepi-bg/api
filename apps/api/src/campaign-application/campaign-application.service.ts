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
    if (
      !createCampaignApplicationDto.acceptTermsAndConditions ||
      !createCampaignApplicationDto.transparencyTermsAccepted ||
      !createCampaignApplicationDto.personalInformationProcessingAccepted
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

    //! kakvo trqbva da naprawq kogato veche ima kampaniq s dadeniq organaizerImeil
    //   const existingApplication = await prisma.campaignApplication.findUnique({
    //     where: { organizer_email: newOrganizerEmail }
    // });

    const newCampaignApplication = this.prisma.campaignApplication.create({
      data: {
        campaignName: createCampaignApplicationDto.campaignName,
        organizerName: createCampaignApplicationDto.organizerName,
        organizerEmail: createCampaignApplicationDto.organizerEmail,
        organizerPhone: createCampaignApplicationDto.organizerPhone,
        beneficiary: createCampaignApplicationDto.beneficiary,
        organizerBeneficiaryRel: createCampaignApplicationDto.organizerBeneficiaryRel,
        goal: createCampaignApplicationDto.goal,
        history: createCampaignApplicationDto.history,
        amount: createCampaignApplicationDto.amount,
        description: createCampaignApplicationDto.description,
        campaignGuarantee: createCampaignApplicationDto.campaignGuarantee,
        otherFinanceSources: createCampaignApplicationDto.otherFinanceSources,
        otherNotes: createCampaignApplicationDto.otherNotes,
        category: createCampaignApplicationDto.category,
        organizerId: organizer.id,
      },
    })

    return newCampaignApplication
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
