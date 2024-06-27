import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { UpdateCampaignApplicationDto } from './dto/update-campaign-application.dto'
import { PrismaService } from '../prisma/prisma.service'
import { OrganizerService } from '../organizer/organizer.service'
import { PersonService } from '../person/person.service'
import { log } from 'console'

@Injectable()
export class CampaignApplicationService {
  constructor(
    private prisma: PrismaService,
    private organizerService: OrganizerService,
    private personService: PersonService,
  ) {}
  async getCampaignByIdWithPersonIds(id: string): Promise<UpdateCampaignApplicationDto> {
    throw new Error('Method not implemented.')
  }

  async create(createCampaignApplicationDto: CreateCampaignApplicationDto) {
    if (
      !createCampaignApplicationDto.acceptTermsAndConditions ||
      !createCampaignApplicationDto.transparencyTermsAccepted ||
      !createCampaignApplicationDto.personalInformationProcessingAccepted
    ) {
      throw new BadRequestException('All agreements must be checked')
    }

    //! debugging purposes - delete when pushing
    const users = await this.personService.findAll()
    const organaisers = await this.organizerService.findAll()
    console.log(users)
    console.log(organaisers)

    //! not sure if it is my job to create organizer
    let organizer = await this.prisma.organizer.findUnique({
      //this is just Id(NOT keycloackId)
      where: { id: 'f8563be6-384c-4f92-a1bb-304408ee2eb9' },
    })

    if (!organizer) {
      //this is just Id(NOT keycloackId)
      organizer = await this.organizerService.create({
        personId: 'f8563be6-384c-4f92-a1bb-304408ee2eb9',
      })
    }

    //! task - [API] [Organizer] Create a CampaignApplication - persist to db
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
        organizerId: 'f8563be6-384c-4f92-a1bb-304408ee2eb9',
        // organizerId: organizer,
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
