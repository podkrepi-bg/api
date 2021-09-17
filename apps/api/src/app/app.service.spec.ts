import { Test } from '@nestjs/testing'

import { AppService } from './app.service'

describe('AppService', () => {
  let service: AppService

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile()

    service = app.get<AppService>(AppService)
  })

  describe('getData', () => {
    it('should return "Welcome to Podkrepi.bg Backend API! See Swagger docs at /docs"', () => {
      expect(service.getData()).toEqual({ message: 'Welcome to Podkrepi.bg Backend API! See Swagger docs at /docs' })
    })
  })
})
