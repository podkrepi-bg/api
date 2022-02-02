import { Test, TestingModule } from '@nestjs/testing'
import { BootcampInternService } from './bootcamp-intern.service'

describe('BootcampInternService', () => {
  let service: BootcampInternService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BootcampInternService],
    }).compile()

    service = module.get<BootcampInternService>(BootcampInternService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
