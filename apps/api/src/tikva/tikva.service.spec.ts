import { Test, TestingModule } from '@nestjs/testing'
import { TikvaService } from './tikva.service'

describe('TikvaService', () => {
  let service: TikvaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TikvaService],
    }).compile()

    service = module.get<TikvaService>(TikvaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
