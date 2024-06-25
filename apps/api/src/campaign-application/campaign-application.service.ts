import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { UpdateCampaignApplicationDto } from './dto/update-campaign-application.dto'

@Injectable()
export class CampaignApplicationService {
  async getCampaignByIdWithPersonIds(id: string): Promise<UpdateCampaignApplicationDto> {
    throw new Error('Method not implemented.')
  }

  create(createCampaignApplicationDto: CreateCampaignApplicationDto) {
    if (
      !createCampaignApplicationDto.acceptTermsAndConditions ||
      !createCampaignApplicationDto.transparencyTermsAccepted ||
      !createCampaignApplicationDto.personalInformationProcessingAccepted
    ) {
      throw new HttpException('All agreements must be checked', HttpStatus.METHOD_NOT_ALLOWED)
    }
    return 'This action adds a new campaignApplication'
  }

  findAll() {
    return `This action returns all campaignApplication`
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
