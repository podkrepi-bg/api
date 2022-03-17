import { Injectable } from '@nestjs/common';
import { CreateCampaignDocumentRoleDto } from './dto/create-campaign-document-role.dto';
import { UpdateCampaignDocumentRoleDto } from './dto/update-campaign-document-role.dto';

@Injectable()
export class CampaignDocumentRoleService {
  create(createCampaignDocumentRoleDto: CreateCampaignDocumentRoleDto) {
    return 'This action adds a new campaignDocumentRole';
  }

  findAll() {
    return `This action returns all campaignDocumentRole`;
  }

  findOne(id: number) {
    return `This action returns a #${id} campaignDocumentRole`;
  }

  update(id: number, updateCampaignDocumentRoleDto: UpdateCampaignDocumentRoleDto) {
    return `This action updates a #${id} campaignDocumentRole`;
  }

  remove(id: number) {
    return `This action removes a #${id} campaignDocumentRole`;
  }
}
