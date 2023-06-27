import { IrisTasks } from './bank-import/import-transactions.task'
import { Test, TestingModule } from '@nestjs/testing'
import { HttpModule } from '@nestjs/axios'

import { MockPrismaService } from '../prisma/prisma-client.mock'
import { SchedulerRegistry } from '@nestjs/schedule/dist'
import { DonationsService } from '../donations/donations.service'
import { ConfigService } from '@nestjs/config'
import { PersonService } from '../person/person.service'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { CampaignService } from '../campaign/campaign.service'

import { VaultService } from '../vault/vault.service'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { ExportService } from '../export/export.service'
import { TasksInitializer } from './tasks-initializer.service'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'

describe('ImportTransactionsTask', () => {
  let taskService: TasksInitializer
  let testModule: TestingModule
  let scheduler: SchedulerRegistry
  const personServiceMock = {
    findOneByKeycloakId: jest.fn(() => {
      return { id: 'mock' }
    }),
  }
  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
  }

  // Mock this before instantiating service - else it failss
  jest
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    .spyOn(IrisTasks.prototype as any, 'checkForRequiredVariables')
    .mockImplementation(() => true)

  beforeEach(async () => {
    testModule = await Test.createTestingModule({
      imports: [HttpModule, NotificationModule],
      providers: [
        IrisTasks,
        MockPrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
        DonationsService,
        VaultService,
        CampaignService,
        PersonService,
        ExportService,
        SchedulerRegistry,
        TasksInitializer,
        EmailService,
        TemplateService,
      ],
    })
      .overrideProvider(PersonService)
      .useValue(personServiceMock)
      .compile()

    taskService = await testModule.get(TasksInitializer)
    scheduler = testModule.get<SchedulerRegistry>(SchedulerRegistry)
  })

  afterEach(() => {
    jest.clearAllMocks()
    scheduler.getIntervals().forEach((el) => scheduler.deleteInterval(el))
  })

  it('should be defined', () => {
    expect(taskService).toBeDefined()
  })

  describe('initIrisTasks', () => {
    it('should init all dynamicaly scheduled tasks', async () => {
      jest.spyOn(taskService, 'initImportTransactionsTask')
      jest.spyOn(scheduler, 'addInterval')

      //   On module initiation all dynamic jobs must be scheduled
      taskService.onModuleInit()

      expect(taskService.initImportTransactionsTask).toHaveBeenCalled()

      expect(scheduler.addInterval).toHaveBeenCalledWith(
        'import-bank-transactions',
        expect.anything(),
      )
      expect(scheduler.getIntervals()).toEqual(['import-bank-transactions'])
    })
  })
})
