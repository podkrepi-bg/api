import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { UpdateCampaignApplicationDto } from './dto/update-campaign-application.dto'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CampaignApplicationService {
  constructor(private prisma: PrismaService) {}

  async getCampaignByIdWithPersonIds(id: string): Promise<UpdateCampaignApplicationDto> {
    throw new Error('Method not implemented.')
  }

  create(createCampaignApplicationDto: CreateCampaignApplicationDto) {
    if (
      !createCampaignApplicationDto.acceptTermsAndConditions ||
      !createCampaignApplicationDto.transparencyTermsAccepted ||
      !createCampaignApplicationDto.personalInformationProcessingAccepted
    ) {
      throw new BadRequestException('All agreements must be checked')
    }
    return 'This action adds a new campaignApplication'
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
