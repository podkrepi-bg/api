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
      const appVersion = process.env.APP_VERSION || 'unknown'
      expect(service.getData())
        .toEqual({
          version: appVersion,
          message: 'Welcome to Podkrepi.bg Backend API! See Swagger docs at /docs'
        })
    })
  })
})
