import { HttpService } from '@nestjs/axios'
import { Logger, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SchedulerRegistry } from '@nestjs/schedule'
import {
  BankDonationStatus,
  Currency,
  DonationStatus,
  DonationType,
  PaymentProvider,
  Prisma,
  Vault,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import {
  GetIrisBanksResponse,
  GetIrisTransactionInfoResponse,
  GetIrisUserIbanAccountsResponse,
  IrisIbanAccountInfo,
  IrisTransactionInfo,
} from './dto/response.dto'

import { DateTime } from 'luxon'
import { toMoney } from '../common/money'
import { DonationsService } from '../donations/donations.service'
import { CreateBankPaymentDto } from '../donations/dto/create-bank-payment.dto'

@Injectable()
export class ImportTransactionsTask {
  private agentHash: string
  private userHash: string
  private bankBIC: string
  private IBAN: string
  private apiUrl: string
  private paymentMethodId = 'IRIS bank import'
  // Used to check if the task should be stopped
  private canRun = true

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
    private readonly donationsService: DonationsService,
    private prisma: PrismaService,
  ) {
    this.agentHash = this.config.get<string>('iris.agentHash', '')
    this.userHash = this.config.get<string>('iris.userHash', '')
    this.bankBIC = this.config.get<string>('iris.bankBIC', '')
    this.IBAN = this.config.get<string>('iris.platformIBAN', '')
    this.apiUrl = this.config.get<string>('iris.apiUrl', '')

    this.checkForRequiredVariables()
  }

  // NestJS Lifecycle Hook
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
        await this.importBankTransactions()
      } catch (e) {
        Logger.error('An error occured while executing importBankTransactions')
      }
    }

    const task = setInterval(callback, interval)

    this.schedulerRegistry.addInterval('import-bank-transactions', task)

    Logger.debug(`import-bank-transactions task registered to run every ${minutes} minutes`)
  }

  // Actual task to run
  async importBankTransactions() {
    // De-register the task, so that it doesn't waste server resources
    if (!this.canRun) {
      this.deregisterTask('import-bank-transactions')
      return
    }

    Logger.debug('RUNNING TASK - import-bank-transactions')

    // 1.  Get IRIS IBAN Account Info
    let ibanAccount: IrisIbanAccountInfo
    try {
      const account = await this.getIrisUserIBANaccount()

      // TODO - Notify that consent should be given
      if (!account) return Logger.error(`no consent granted for IBAN: ${this.IBAN}`)

      ibanAccount = account
    } catch (e) {
      return Logger.error('Failed to get iban data from Iris')
    }

    // 2. Get transactions from IRIS
    let transactions: IrisTransactionInfo[]
    try {
      transactions = await this.getTransactions(ibanAccount)
      // No transactions for the day yet
      if (!transactions.length) return
    } catch (e) {
      return Logger.error('Failed to get transactions data from Iris')
    }

    // 3. Check if the cron should actually run
    try {
      const isUpToDate = await this.hasNewOrNonImportedTransactions(transactions)

      /** 
       Should we let it run every time, (giving it a chance to import some previously failed donation for example, because DB was down for 0.5 sec). 
       This would also mean that the whole flow will run for all transactions every time
      **/

      if (isUpToDate) '' // return or continue ?
    } catch (e) {
      // Failure of this check is not critical
    }

    // 4. Prepare the BankTransaction Records
    let bankTrxRecords: Prisma.BankTransactionCreateManyInput[]
    try {
      bankTrxRecords = this.prepareBankTransactionRecords(transactions, ibanAccount)
    } catch (e) {
      return Logger.error('Error while preparing BankTransaction records')
    }

    // 5. Parse transactions and create the donations
    let processedBankTrxRecords: Prisma.BankTransactionCreateManyInput[]
    try {
      processedBankTrxRecords = await this.processDonations(bankTrxRecords)
    } catch (e) {
      return Logger.error('Failed to process transaction donations')
    }

    // 6. Save BankTransactions to DB
    try {
      const result = await this.saveBankTrxRecords(processedBankTrxRecords)
    } catch (e) {
      return Logger.error('Failed to import transactions into DB')
    }

    return
  }

  private async getIrisBankHash() {
    const endpoint = this.config.get<string>('iris.banksEndPoint', '')

    const banks = (
      await this.httpService.axiosRef.get<GetIrisBanksResponse>(endpoint, {
        headers: {
          'x-user-hash': this.userHash,
        },
      })
    ).data

    // Find the bankHash for the provided BIC
    const bankHash = banks.find((bank) => bank.bic === this.bankBIC)?.bankHash

    return bankHash
  }

  private async getIrisUserIBANaccount() {
    const endpoint = this.config.get<string>('iris.ibansEndPoint', '')

    const ibanAccounts = (
      await this.httpService.axiosRef.get<GetIrisUserIbanAccountsResponse>(endpoint, {
        headers: {
          'x-user-hash': this.userHash,
          'consent-details': true,
        },
      })
    ).data

    // Find if provided IBAN is registered on IRIS and has a valid consent
    const account = ibanAccounts.find(
      (account) =>
        account.iban.trim() === this.IBAN && account.consents.consents[0].status === 'valid',
    )

    return account
  }

  private async getTransactions(ibanAccount: IrisIbanAccountInfo) {
    const endpoint = this.config.get<string>('iris.transactionsEndPoint', '')

    const today = DateTime.now().toFormat('yyyy-MM-dd')

    const response = (
      await this.httpService.axiosRef.get<GetIrisTransactionInfoResponse>(
        endpoint + `/${ibanAccount.id}` + `?dateFrom=${today}&dateTo=${today}`,
        {
          headers: {
            'x-user-hash': this.userHash,
            'x-agent-hash': this.agentHash,
          },
        },
      )
    ).data

    return response.transactions
  }

  // Checks to see if all transactions have been processed already
  private async hasNewOrNonImportedTransactions(transactions: IrisTransactionInfo[]) {
    const transactionIds = transactions.map((trx) => trx.transactionId)

    const count = await this.prisma.bankTransaction.count({
      where: {
        id: {
          in: transactionIds,
        },
      },
    })

    return transactionIds.length === count
  }

  // Only prepares the data, without inserting it in the DB
  private prepareBankTransactionRecords(
    transactions: IrisTransactionInfo[],
    ibanAccount: IrisIbanAccountInfo,
  ) {
    const data: Prisma.BankTransactionCreateManyInput[] = transactions.map((trx) => ({
      id: trx.transactionId?.trim() || ``,
      ibanNumber: ibanAccount.iban,
      bankName: ibanAccount.bankName,
      bankIdCode: this.bankBIC,
      transactionDate: new Date(trx.valueDate),
      senderName: trx.debtorName,
      recipientName: trx.creditorName,
      senderIban: trx.debtorAccount?.iban,
      recipientIban: trx.creditorAccount?.iban,
      type: trx.creditDebitIndicator === 'CREDIT' ? 'credit' : 'debit',
      amount: toMoney(trx.transactionAmount.amount),
      currency: trx.transactionAmount.currency,
      description: trx.remittanceInformationUnstructured.trim(),
    }))

    return data
  }

  private async processDonations(bankTransactions: Prisma.BankTransactionCreateManyInput[]) {
    const processedBankTransactions: Prisma.BankTransactionCreateManyInput[] = []

    /* 
     Better get all campaigns in a single query
     than execute a separate one for each transaction -
     more performent and reliable approach
    */
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        paymentReference: {
          in: bankTransactions
            .filter((trx) => trx.type === 'credit' && trx.description !== 'STRIPE')
            .map((trx) => trx.description.trim()),
        },
      },
      include: {
        vaults: true,
      },
    })

    for (const trx of bankTransactions) {
      // We're interested in parsing only incoming trx's
      if (trx.type !== 'credit') {
        processedBankTransactions.push(trx)
        continue
      }

      // Stripe payments should not be parsed
      if (trx.description === 'STRIPE') {
        processedBankTransactions.push(trx)
        continue
      }

      // Campaign list won't be too large, so searching in-memory should perform better than calling the DB
      const campaign = campaigns.find((cmpgn) => cmpgn.paymentReference === trx.description.trim())

      if (!campaign) {
        trx.bankDonationStatus = BankDonationStatus.unrecognized
        processedBankTransactions.push(trx)
        continue
      }

      // Parse donation
      try {
        const bankPayment = this.prepareBankPaymentObject(trx, campaign.vaults[0])
        await this.donationsService.createUpdateBankPayment(bankPayment)
        // Update status
        trx.bankDonationStatus = BankDonationStatus.imported
        processedBankTransactions.push(trx)
      } catch (e) {
        trx.bankDonationStatus = BankDonationStatus.importFailed
        processedBankTransactions.push(trx)
      }
    }

    return processedBankTransactions
  }

  private prepareBankPaymentObject(
    bankTransaction: Prisma.BankTransactionCreateManyInput,
    vault: Vault,
  ) {
    const bankPayment: CreateBankPaymentDto = {
      amount: bankTransaction.amount || 0,
      currency: bankTransaction.currency || Currency.BGN,
      extCustomerId: bankTransaction.senderIban || '',
      extPaymentIntentId: bankTransaction.id,
      createdAt: new Date(bankTransaction.transactionDate),
      billingName: bankTransaction.senderName || '',
      extPaymentMethodId: this.paymentMethodId,
      targetVaultId: vault.id,
      type: DonationType.donation,
      status: DonationStatus.succeeded,
      provider: PaymentProvider.bank,
      personId: null,
    }

    return bankPayment
  }

  private async saveBankTrxRecords(data: Prisma.BankTransactionCreateManyInput[]) {
    // Insert new transactions
    const inserted = await this.prisma.bankTransaction.createMany({ data, skipDuplicates: true })

    // If all transactions are new, there is nothing to update
    if (inserted.count === data.length) return

    const imported = data
      .filter((el) => el.bankDonationStatus === BankDonationStatus.imported)
      .map((el) => el.id)

    if (!imported.length) return

    // Update previously import-failed donation transactions if they have succeeded on subsequent runs
    await this.prisma.bankTransaction.updateMany({
      where: {
        id: {
          in: imported,
        },
      },
      data: {
        bankDonationStatus: BankDonationStatus.imported,
      },
    })

    return
  }

  private deregisterTask(taskName: string) {
    Logger.debug(`${taskName} task can't run, removing task from TaskRegistry`)
    this.schedulerRegistry.deleteInterval(taskName)
  }

  // Checks if the task has all required vars to run
  private checkForRequiredVariables() {
    if (!this.agentHash) {
      Logger.error(`Env variable for /agentHash/ not provided`)
      this.canRun = false
      return
    }
    if (!this.userHash) {
      Logger.error(`Env variable for /userHash/ not provided`)
      this.canRun = false
      return
    }
    if (!this.bankBIC) {
      Logger.error(`Env variable for /bankBIC/ not provided`)
      this.canRun = false
      return
    }
    if (!this.IBAN) {
      Logger.error(`Env variable for /platform IBAN/ not provided`)
      this.canRun = false
      return
    }
    if (!this.apiUrl) {
      Logger.error(`Env variable for /iris Url/ not provided`)
      this.canRun = false
      return
    }
  }
}
