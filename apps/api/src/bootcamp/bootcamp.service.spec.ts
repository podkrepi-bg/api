import { Test, TestingModule } from '@nestjs/testing';
import { BootcampService } from './bootcamp.service';
import { PrismaService } from '../prisma/prisma.service'
describe('BootcampService', () => {
  let service: BootcampService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BootcampService],
    }).compile();

    service = module.get<BootcampService>(BootcampService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
