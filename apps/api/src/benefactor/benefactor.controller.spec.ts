import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BenefactorController } from './benefactor.controller';
import { BenefactorService } from './benefactor.service';

describe('BenefactorController', () => {
  let controller: BenefactorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BenefactorController],
      providers: [BenefactorService, PrismaService],
    }).compile();

    controller = module.get<BenefactorController>(BenefactorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
