import { Test, TestingModule } from '@nestjs/testing';
import { InfoRequestService } from './info-request.service';

describe('InfoRequestService', () => {
  let service: InfoRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfoRequestService],
    }).compile();

    service = module.get<InfoRequestService>(InfoRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
