import { Test, TestingModule } from '@nestjs/testing';
import { RefreshController } from './refresh.controller';

describe('RefreshController', () => {
  let controller: RefreshController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RefreshController],
    }).compile();

    controller = module.get<RefreshController>(RefreshController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
