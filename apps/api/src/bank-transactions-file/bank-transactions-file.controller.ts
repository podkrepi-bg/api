import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Response,
  Delete,
  StreamableFile,
  forwardRef,
  Inject,
  Logger,
  NotFoundException,

} from '@nestjs/common'
import { BankTransactionsFileService } from './bank-transactions-file.service'
import 'multer'
import { FilesInterceptor } from '@nestjs/platform-express'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { FilesTypesDto } from './dto/files-type.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { PersonService } from '../person/person.service'
import { VaultService } from '../vault/vault.service'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { parseBankTransactionsFile } from './helpers/parser'
import { DonationStatus, DonationType, PaymentProvider } from '@prisma/client'
import { CreateManyBankPaymentsDto } from '../donations/dto/create-many-bank-payments.dto'

@Controller('bank-transactions-file')
export class BankTransactionsFileController {
  constructor(
    private readonly bankTransactionsFileService: BankTransactionsFileService,
    @Inject(forwardRef(() => VaultService)) private vaultService: VaultService,
    private readonly donationsService: DonationsService,
    private readonly campaignService: CampaignService,
    @Inject(forwardRef(() => PersonService)) private readonly personService: PersonService,
  ) {}

  @Post(':bank_transactions_file_id')
  @UseInterceptors(FilesInterceptor('file', 5, { limits: { fileSize: 10485760 } }))
  async create(
    @Param('bank_transactions_file_id') bankTransactionsFileId: string,
    @Body() body: FilesTypesDto,
    @UploadedFiles() files: Express.Multer.File[],
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const keycloakId = user.sub as string
    const person = await this.personService.findOneByKeycloakId(keycloakId)
    if (!person) {
      Logger.warn('No person record with keycloak ID: ' + keycloakId)
      throw new NotFoundException('No person record with keycloak ID: ' + keycloakId)
    }

    const allMovements: { payment: CreateManyBankPaymentsDto; paymentRef: string }[][] = []
    let accountMovementsForAFile: { payment: CreateManyBankPaymentsDto; paymentRef: string }[] = []

    const promises = await Promise.all(
      files.map((file, key) => {
        accountMovementsForAFile = parseBankTransactionsFile(file.buffer)
        allMovements.push(accountMovementsForAFile)
        const filesType = body.types
        return this.bankTransactionsFileService.create(
          Array.isArray(filesType) ? filesType[key] : filesType,
          file.originalname,
          file.mimetype,
          bankTransactionsFileId,
          person,
          file.buffer,
        )
      }),
    )
    const donations: CreateManyBankPaymentsDto[] = []
    for (const fileOfBankMovements of allMovements) {
      for await (const movement of fileOfBankMovements) {
        const campaign = await this.campaignService.getCampaignByPaymentReference(
          movement.paymentRef,
        )
        if (!campaign) {
          Logger.warn('No campaign with payment reference: ' + movement.paymentRef)
          throw new NotFoundException('No campaign with payment reference: ' + movement.paymentRef)
        }
        const vault = await this.vaultService.findByCampaignId(campaign.id)
        movement.payment.extPaymentMethodId = 'imported file bank payment'
        movement.payment.targetVaultId = vault[0].id
        movement.payment.personId = person.id
        movement.payment.targetVaultId = vault[0].id
        ;(movement.payment.type = DonationType.donation),
          (movement.payment.status = DonationStatus.succeeded),
          (movement.payment.provider = PaymentProvider.bank),
          donations.push(movement.payment)
      }
    }
    await this.donationsService.createManyBankPayments(donations)

    return promises
  }

  @Get()
  findAll() {
    return this.bankTransactionsFileService.findAll()
  }

  @Get(':id')
  @Public()
  async findOne(
    @Param('id') id: string,
    @Response({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    const file = await this.bankTransactionsFileService.findOne(id)
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': 'attachment; filename="' + file.filename + '"',
    })

    return new StreamableFile(file.stream)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.bankTransactionsFileService.remove(id)
  }
}
