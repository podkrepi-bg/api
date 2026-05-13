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
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { PaymentSessionService } from '../iris-pay/services/payment-session.service'

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
  const paymentSessionServiceMock = {
    purgeExpiredSessions: jest.fn().mockResolvedValue(0),
  }

  // Mock the IrisTask check for environment variables
  jest
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    .spyOn(IrisTasks.prototype as any, 'checkForRequiredVariables')
    .mockImplementation(() => true)

  beforeEach(async () => {
    testModule = await Test.createTestingModule({
      imports: [HttpModule, NotificationModule, MarketingNotificationsModule],
      providers: [
        IrisTasks,
        MockPrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue?: unknown) => defaultValue),
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
        { provide: PaymentSessionService, useValue: paymentSessionServiceMock },
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
    scheduler.getCronJobs().forEach((_, name) => scheduler.deleteCronJob(name))
  })

  it('should be defined', () => {
    expect(taskService).toBeDefined()
  })

  describe('initIrisTasks', () => {
    it('should init all dynamicaly scheduled tasks', async () => {
      jest.spyOn(taskService, 'initImportTransactionsTask')
      jest.spyOn(taskService, 'initPurgeExpiredPaymentSessionsTask')
      jest.spyOn(scheduler, 'addInterval')
      jest.spyOn(scheduler, 'addCronJob')

      //   On module initiation all dynamic jobs must be scheduled
      taskService.onModuleInit()

      expect(taskService.initImportTransactionsTask).toHaveBeenCalled()
      expect(taskService.initPurgeExpiredPaymentSessionsTask).toHaveBeenCalled()

      expect(scheduler.addInterval).toHaveBeenCalledWith(
        'import-bank-transactions',
        expect.anything(),
      )
      expect(scheduler.addCronJob).toHaveBeenCalledWith(
        'purge-expired-payment-sessions',
        expect.anything(),
      )
      expect(scheduler.getIntervals()).toEqual(['import-bank-transactions'])
      expect(Array.from(scheduler.getCronJobs().keys())).toEqual(['purge-expired-payment-sessions'])
    })
  })
})
