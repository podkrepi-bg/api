import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { IrregularityService } from '../irregularity/irregularity.service'
import { PersonService } from '../person/person.service'

import { MockPrismaService } from '../prisma/prisma-client.mock'
import { S3Service } from '../s3/s3.service'
import { IrregularityFileController } from './irregularity-file.controller'
import { IrregularityFileService } from './irregularity-file.service'

describe('IrregularityFileController', () => {
  let controller: IrregularityFileController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IrregularityFileController],
      providers: [
        ConfigService,
        IrregularityFileService,
        IrregularityService,
        MockPrismaService,
        S3Service,
        PersonService,
      ],
    }).compile()

    controller = module.get<IrregularityFileController>(IrregularityFileController)
  })
  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
