import { Test, TestingModule } from '@nestjs/testing';
import { CampaignDocumentRoleService } from './campaign-document-role.service';

describe('CampaignDocumentRoleService', () => {
  let service: CampaignDocumentRoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignDocumentRoleService],
    }).compile();

    service = module.get<CampaignDocumentRoleService>(CampaignDocumentRoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
