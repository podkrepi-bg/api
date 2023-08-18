import { Injectable, Logger } from '@nestjs/common'
import { IrisTasks } from './bank-import/import-transactions.task'
import { ConfigService } from '@nestjs/config'
import { Cron, SchedulerRegistry } from '@nestjs/schedule'

// Schedules all background tasks
@Injectable()
export class TasksInitializer {
  constructor(
    private readonly irisTasks: IrisTasks,
    private readonly config: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  /* DYNAMICALY SCHEDULED TASKS */

  onModuleInit() {
    try {
      this.initImportTransactionsTask()
    } catch (e) {
      Logger.error('Failed to initialize ImportTransactionsTask')
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
