import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from '../prisma/prisma.health';
import { PrismaService } from '../prisma/prisma.service'
import { TerminusModule } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      imports: [TerminusModule],
      providers: [PrismaService, PrismaHealthIndicator],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
