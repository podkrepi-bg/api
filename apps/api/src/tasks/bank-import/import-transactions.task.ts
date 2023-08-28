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
import { PrismaService } from '../../prisma/prisma.service'
import {
  GetConsentLinkResponse,
  GetIrisBanksResponse,
  GetIrisTransactionInfoResponse,
  GetIrisUserIbanAccountsResponse,
  GetIrisUserIbanConsentsResponse,
  IrisIbanAccountInfo,
  IrisTransactionInfo,
} from './dto/response.dto'

import { DateTime } from 'luxon'
import { toMoney } from '../../common/money'
import { DonationsService } from '../../donations/donations.service'
import { CreateBankPaymentDto } from '../../donations/dto/create-bank-payment.dto'
import { EmailService } from '../../email/email.service'
import {
  ExpiringIrisConsentEmailDto,
  UnrecognizedDonationEmailDto,
} from '../../email/template.interface'

type filteredTransaction = Prisma.BankTransactionCreateManyInput

@Injectable()
export class IrisTasks {
  private agentHash: string
  private userHash: string
  private bankBIC: string
  protected IBAN: string
  private apiUrl: string
  private billingAdminEmail: string
  private paymentMethodId = 'IRIS bank import'
  private regexPaymentRef = /\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\b/g
  // Consent expiration days left for notification
  private daysToExpCondition = 5
  // Used to check if the task should be stopped
  private canRun = true

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
    private readonly donationsService: DonationsService,
    private prisma: PrismaService,
    private sendEmail: EmailService,
  ) {
    this.agentHash = this.config.get<string>('iris.agentHash', '')
    this.userHash = this.config.get<string>('iris.userHash', '')
    this.bankBIC = this.config.get<string>('iris.bankBIC', '')
    this.IBAN = this.config.get<string>('iris.platformIBAN', '')
    this.apiUrl = this.config.get<string>('iris.apiUrl', '')
    this.billingAdminEmail = this.config.get<string>('iris.billingAdminEmail', '')

    this.checkForRequiredVariables()
  }

  /** TASKS */

  async notifyForExpiringIrisConsentTASK() {
    Logger.debug('RUNNING TASK - Check Iris Consent')

    const account = await this.getIrisUserIBANaccount()

    //TODO - Notify that the iban is not registered
    if (!account) return

    // Get consent details
    const endpoint = this.config
      .get<string>('iris.checkConsentEndPoint', '')
      .replace('{ibanID}', `${account.id}`)

    const consents = (
      await this.httpService.axiosRef.get<GetIrisUserIbanConsentsResponse>(endpoint, {
        headers: {
          'x-user-hash': this.userHash,
        },
      })
    ).data

    // Filter to current IBAN
    const consent = consents.consents.find((consent) => consent.iban.trim() === this.IBAN)

    if (!consent) return

    const expDate = DateTime.fromFormat(consent.validUntil, 'yyyy-MM-dd')
    const daysToExpire = Math.ceil(expDate.diff(DateTime.local(), 'days').toObject().days || 0)

    // If less than 5 days till expiration -> notify
    if (daysToExpire <= this.daysToExpCondition) {
      // Get consent renew link
      const renewLink = await this.getConsentLink(account.bankHash)

      // Prepare Email data
      const recepient = { to: [this.billingAdminEmail] }
      const mail = new ExpiringIrisConsentEmailDto({
        daysToExpire,
        expiresAt: consent.validUntil,
        renewLink,
      })

      // Send Notification
      await this.sendEmail.sendFromTemplate(mail, recepient, {
        //Allow users to receive the mail, regardles of unsubscribes
        bypassUnsubscribeManagement: { enable: true },
      })
    }
  }

  async importBankTransactionsTASK(transactionsDate: Date) {
    // De-register the task, so that it doesn't waste server resources
    if (!this.canRun) {
      this.deregisterTask('import-bank-transactions')
      return
    }

    Logger.debug('RUNNING TASK - import-bank-transactions for date: ' + transactionsDate)

    // 1.  Get IRIS IBAN Account Info
    let ibanAccount: IrisIbanAccountInfo
    try {
      const account = await this.getIrisUserIBANaccount()

      if (!account) return Logger.error(`no consent granted for IBAN: ${this.IBAN}`)
      if (account.consents.consents[0].status !== 'valid')
        return Logger.error(`consent expired for IBAN: ${this.IBAN}`)

      ibanAccount = account
    } catch (e) {
      return Logger.error('Failed to get iban data from Iris')
    }

    // 2. Get transactions from IRIS
    let transactions: IrisTransactionInfo[]
    try {
      transactions = await this.getTransactions(ibanAccount, transactionsDate)
      // No transactions for the day yet
      if (!transactions.length) return
    } catch (e) {
      return Logger.error('Failed to get transactions data from Iris')
    }

    // 3. Check if the cron should actually run
    try {
      const isUpToDate = await this.hasNewOrNonImportedTransactions(transactions, transactionsDate)

      /**
       Should we let it run every time, (giving it a chance to import some previously failed donation for example, because DB was down for 0.5 sec).
       This would also mean that the whole flow will run for all transactions every time
      **/

      if (isUpToDate) return
    } catch (e) {
      // Failure of this check is not critical
    }

    // 4. Prepare the BankTransaction Records
    let bankTrxRecords: filteredTransaction[]
    try {
      bankTrxRecords = this.prepareBankTransactionRecords(transactions, ibanAccount)
    } catch (e) {
      return Logger.error('Error while preparing BankTransaction records')
    }

    // 5. Parse transactions and create the donations
    let processedBankTrxRecords: filteredTransaction[]
    try {
      processedBankTrxRecords = await this.processDonations(bankTrxRecords)
    } catch (e) {
      return Logger.error('Failed to process transaction donations')
    }

    // 6. Save BankTransactions to DB
    try {
      await this.saveBankTrxRecords(processedBankTrxRecords)
    } catch (e) {
      return Logger.error('Failed to import transactions into DB')
    }

    //7. Notify about unrecognized donations
    try {
      await this.sendUnrecognizedDonationsMail(processedBankTrxRecords)
    } catch (e) {
      return Logger.error('Failed to notify about bad transaction donations')
    }

    return
  }

  /** METHODS */

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
    const account = ibanAccounts.find((account) => account.iban.trim() === this.IBAN)

    return account
  }

  private async getTransactions(ibanAccount: IrisIbanAccountInfo, transactionsDate: Date) {
    const endpoint = this.config.get<string>('iris.transactionsEndPoint', '')

    const dateToCheck = transactionsDate.toISOString().split('T')[0]

    Logger.debug('Getting transactions for date:' + dateToCheck)

    const response = (
      await this.httpService.axiosRef.get<GetIrisTransactionInfoResponse>(
        endpoint + `/${ibanAccount.id}` + `?dateFrom=${dateToCheck}&dateTo=${dateToCheck}`,
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
  private async hasNewOrNonImportedTransactions(
    transactions: IrisTransactionInfo[],
    transactionsDate: Date,
  ) {
    const dateToCheck = new Date(transactionsDate.toISOString().split('T')[0])

    const count = await this.prisma.bankTransaction.count({
      where: {
        transactionDate: {
          gte: dateToCheck,
          lte: dateToCheck,
        },
      },
    })

    return transactions.length === count
  }

  // Only prepares the data, without inserting it in the DB
  private prepareBankTransactionRecords(
    transactions: IrisTransactionInfo[],
    ibanAccount: IrisIbanAccountInfo,
  ) {
    const filteredTransactions: filteredTransaction[] = []

    for (const trx of transactions) {
      // We're interested in parsing only incoming trx's
      if (trx.creditDebitIndicator !== 'CREDIT') {
        continue
      }

      // Stripe payments should not be parsed
      if (trx.remittanceInformationUnstructured?.trim() === 'STRIPE') {
        continue
      }

      // Try to recognize campaign payment reference
      const matchedRef = trx.remittanceInformationUnstructured
        ?.trim()
        .replace(/[ _]+/g, '-')
        .match(this.regexPaymentRef)

      filteredTransactions.push({
        id: trx.transactionId?.trim() || ``,
        ibanNumber: ibanAccount.iban,
        bankName: ibanAccount.bankName,
        bankIdCode: this.bankBIC,
        transactionDate: new Date(trx.valueDate),
        senderName: trx.debtorName?.trim(),
        recipientName: trx.creditorName?.trim(),
        senderIban: trx.debtorAccount?.iban?.trim(),
        recipientIban: trx.creditorAccount?.iban?.trim(),
        type: trx.creditDebitIndicator === 'CREDIT' ? 'credit' : 'debit',
        amount: toMoney(trx.transactionAmount?.amount),
        currency: trx.transactionAmount?.currency,
        description: trx.remittanceInformationUnstructured?.trim(),
        // Not saved in the DB, it's added only for convinience and efficiency
        matchedRef: matchedRef ? matchedRef[0] : null,
      })
    }

    return filteredTransactions
  }

  private async processDonations(bankTransactions: filteredTransaction[]) {
    const matchedPaymentRef: string[] = []
    bankTransactions.forEach((trx) => {
      if (trx.matchedRef) matchedPaymentRef.push(trx.matchedRef)
    })

    /*
     Better get all campaigns in a single query
     than execute a separate one for each transaction -
     more performent and reliable approach
    */
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        paymentReference: {
          in: matchedPaymentRef,
        },
      },
      include: {
        vaults: true,
      },
    })

    for (const trx of bankTransactions) {
      if (!trx.matchedRef) {
        trx.bankDonationStatus = BankDonationStatus.unrecognized
        continue
      }

      // Campaign list won't be too large, so searching in-memory should perform better than calling the DB
      const campaign = campaigns.find((cmpgn) => cmpgn.paymentReference === trx.matchedRef)

      if (!campaign) {
        trx.bankDonationStatus = BankDonationStatus.unrecognized
        continue
      }

      // Parse donation
      try {
        const bankPayment = this.prepareBankPaymentObject(trx, campaign.vaults[0])
        await this.donationsService.createUpdateBankPayment(bankPayment)
        // Update status
        trx.bankDonationStatus = BankDonationStatus.imported
      } catch (e) {
        trx.bankDonationStatus = BankDonationStatus.importFailed
      }
    }

    return bankTransactions
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

  private async saveBankTrxRecords(data: filteredTransaction[]) {
    // Insert new transactions
    const inserted = await this.prisma.bankTransaction.createMany({ data, skipDuplicates: true })

    return inserted
  }

  private async sendUnrecognizedDonationsMail(data: filteredTransaction[]) {
    // Filter the unnotified failed/unrecognized transactions
    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        id: {
          in: data.map((trx) => trx.id),
        },
        bankDonationStatus: {
          in: [BankDonationStatus.importFailed, BankDonationStatus.unrecognized],
        },
        notified: false,
      },
    })

    if (!transactions?.length) return

    // Build the link to bank-transactions section
    const stage = this.config.get<string>('APP_ENV') === 'development' ? 'APP_URL_LOCAL' : 'APP_URL'
    const appUrl = this.config.get<string>(stage)
    const link = `${appUrl}/admin/bank-transactions`

    // Format amount
    transactions.forEach((trx) => (trx.amount /= 100))

    // Prepare Email data
    const recepient = { to: [this.billingAdminEmail] }
    const mail = new UnrecognizedDonationEmailDto({
      transactions,
      importDate: DateTime.now().toFormat('dd-MM-yyyy'),
      link,
    })

    // Send Notification
    await this.sendEmail.sendFromTemplate(mail, recepient, {
      //Allow users to receive the mail, regardles of unsubscribes
      bypassUnsubscribeManagement: { enable: true },
    })

    // Mark notified
    await this.prisma.bankTransaction.updateMany({
      where: { id: { in: transactions.map((trx) => trx.id) } },
      data: {
        notified: true,
      },
    })
  }

  private async getConsentLink(bankHash: string) {
    const endpoint = this.config.get<string>('iris.getConsentEndPoint', '')

    const response = (
      await this.httpService.axiosRef.post<GetConsentLinkResponse>(
        endpoint,
        {
          bankHash,
          iban: this.IBAN,
        },
        {
          headers: {
            'x-user-hash': this.userHash,
          },
        },
      )
    ).data

    return response.startUrl
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
