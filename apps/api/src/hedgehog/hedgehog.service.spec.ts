import { Test, TestingModule } from '@nestjs/testing'
import { HedgehogService } from './hedgehog.service'

describe('HedgehogService', () => {
  let service: HedgehogService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HedgehogService],
    }).compile()

    service = module.get<HedgehogService>(HedgehogService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
