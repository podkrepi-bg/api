import { Test, TestingModule } from '@nestjs/testing';
import { prismaMock } from '../prisma/prisma-client.mock';
import { PrismaService } from '../prisma/prisma.service';
import { SupportService } from '../support/support.service';
import { InfoRequestController } from './info-request.controller';
import { InfoRequestService } from './info-request.service';

describe('InfoRequestController', () => {
  let controller: InfoRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InfoRequestController],
      providers: [
        InfoRequestService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        SupportService
      ],
    }).compile();

    controller = module.get<InfoRequestController>(InfoRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
