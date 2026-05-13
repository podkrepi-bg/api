import { Injectable, Logger } from '@nestjs/common'
import { IrisTasks } from './bank-import/import-transactions.task'
import { ConfigService } from '@nestjs/config'
import { Cron, SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { PaymentSessionService } from '../iris-pay/services/payment-session.service'

// Schedules all background tasks
@Injectable()
export class TasksInitializer {
  constructor(
    private readonly irisTasks: IrisTasks,
    private readonly config: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
    private readonly paymentSessionService: PaymentSessionService,
  ) {}

  /* DYNAMICALY SCHEDULED TASKS */

  onModuleInit() {
    try {
      this.initImportTransactionsTask()
    } catch (e) {
      Logger.error('Failed to initialize ImportTransactionsTask')
    }
    try {
      this.initPurgeExpiredPaymentSessionsTask()
    } catch (e) {
      Logger.error('Failed to initialize PurgeExpiredPaymentSessionsTask', e)
    }
  }

  initImportTransactionsTask() {
    // Set the interval at which the import task will run - default 6 hours
    const minutes = this.config.get<number>('tasks.import_transactions.interval', 60 * 6)
    const interval = 1000 * 60 * Number(minutes)

    const callback = async () => {
      try {
        await this.irisTasks.importBankTransactionsTASK(new Date())
      } catch (e) {
        Logger.error('An error occured while executing importBankTransactions \n', e)
      }
    }

    const task = setInterval(callback, interval)

    this.schedulerRegistry.addInterval('import-bank-transactions', task)

    Logger.debug(`import-bank-transactions task registered to run every ${minutes} minutes`)
  }

  initPurgeExpiredPaymentSessionsTask() {
    const jobName = 'purge-expired-payment-sessions'
    const defaultCron = '0 * * * *'
    const expression = this.config.get<string>('tasks.payment_sessions_purge.cron', defaultCron)

    const job = new CronJob(expression, async () => {
      try {
        await this.paymentSessionService.purgeExpiredSessions()
      } catch (e) {
        Logger.error('An error occured while purging expired payment sessions \n', e)
      }
    })

    this.schedulerRegistry.addCronJob(jobName, job)
    job.start()

    Logger.debug(`${jobName} task registered with cron '${expression}'`)
  }

  /* DECLARATIVELY SCHEDULED TAKS */

  @Cron(`0 ${process.env.CHECK_IRIS_CONSENT_TASK_HOUR} * * *`)
  async initNotifyForExpiringConsentTask() {
    try {
      await this.irisTasks.notifyForExpiringIrisConsentTASK()
    } catch (e) {
      Logger.error('An error occured while checking for bank consent \n', e)
    }
  }
}
