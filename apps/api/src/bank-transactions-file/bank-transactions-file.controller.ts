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
import { CreateBankPaymentDto } from '../donations/dto/create-bank-payment.dto'
import { parseBankTransactionsFile, parseString } from './helpers/parser'

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
  @UseInterceptors(FilesInterceptor('file'))
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

    //checking for file size

    files.forEach((file) => {
      if (file.size > 1048576) {
        Logger.error('File bigger than 1MB' + file.filename)
        throw new NotFoundException('File bigger than 1MB' + file.filename)
      }
    })

    const allMovements: { payment: CreateBankPaymentDto; paymentRef: string }[][] = []
    let accountMovementsForAFile: { payment: CreateBankPaymentDto; paymentRef: string }[] = []
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
    for (const fileOfBankMovements of allMovements) {
      for await (const movement of fileOfBankMovements) {
        const campaign = await this.campaignService.getCampaignByPaymentReference(
          movement.paymentRef,
        )
        if (!campaign) {
          Logger.warn('No campaign with payment reference: ' + movement.paymentRef)
          throw new NotFoundException('No person record with keycloak ID: ' + keycloakId)
        }
        const vault = await this.vaultService.findByCampaignId(campaign.id)
        movement.payment.extPaymentMethodId = 'imported file bank payment'
        movement.payment.targetVaultId = vault[0].id
        movement.payment.personsEmail = person.email
        const donation = await this.donationsService.createBankPayment(movement.payment)
      }
    }
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
