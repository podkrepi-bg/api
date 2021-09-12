import { Test, TestingModule } from '@nestjs/testing';

import { CityController } from './city.controller';
import { CityService } from './city.service';

describe('CityController', () => {
  let controller: CityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CityController],
      providers: [CityService],
    }).compile();

    controller = module.get<CityController>(CityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getData', () => {
    it('should return "Welcome to campaign!"', async () => {
      expect(await controller.getData()).toEqual([
        {
          countryId: '09a56448-ac24-488c-a5fc-37cef53218e0',
          id: 'c7cf8351-562d-418a-b832-fade92a412ab',
          name: 'Sofia',
          postalCode: 1000,
        },
        {
          countryId: '09a56448-ac24-488c-a5fc-37cef53218e0',
          id: '30e2c968-6571-4cba-9949-1075a21a9b82',
          name: 'Varna',
          postalCode: 9000,
        },
      ]);
    });
  });
});
