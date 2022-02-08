import { Test, TestingModule } from '@nestjs/testing';
import { InfoRequestController } from './info-request.controller';
import { InfoRequestService } from './info-request.service';

describe('InfoRequestController', () => {
  let controller: InfoRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InfoRequestController],
      providers: [InfoRequestService],
    }).compile();

    controller = module.get<InfoRequestController>(InfoRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
