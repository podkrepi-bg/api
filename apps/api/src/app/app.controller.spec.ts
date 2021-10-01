import { Test, TestingModule } from '@nestjs/testing'

import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let app: TestingModule

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()
  })

  describe('getData', () => {
    it('should return "Welcome to Podkrepi.bg Backend API! See Swagger docs at /docs"', () => {
      const appVersion = process.env.APP_VERSION || 'unknown'
      const appController = app.get<AppController>(AppController)
      expect(appController.getData()).toEqual({
        version: appVersion,
        message: 'Welcome to Podkrepi.bg Backend API! See Swagger docs at /docs',
      })
    })
  })
})
