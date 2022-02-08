import { Test, TestingModule } from '@nestjs/testing';
import { prismaMock } from '../prisma/prisma-client.mock';
import { PrismaService } from '../prisma/prisma.service';
import { InfoRequestService } from './info-request.service';

describe('InfoRequestService', () => {
  let service: InfoRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InfoRequestService, 
        {
          provide: PrismaService,
          useValue: prismaMock,
        }
      ],
    }).compile();

    service = module.get<InfoRequestService>(InfoRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
