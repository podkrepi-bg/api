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
import { CreatePaymentDto } from '../donations/dto/create-payment.dto'
import { CreateBankPaymentDto } from '../donations/dto/create-bank-payment.dto'
import { Currency } from '@prisma/client'


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

  files.forEach(file=>{
    if(file.size > 1048576){
    Logger.error('File bigger than 1MB' + file.filename)
    throw new NotFoundException('File bigger than 1MB' + file.filename)
    }
  })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parseString = require('xml2js').parseString

    const accountMovements : {payment:CreateBankPaymentDto, paymentRef : string}[] = []
    const promises =  await Promise.all(

      files.map((file, key) => {
        parseString(file.buffer, function (err, items) {
          for (const object in items) {
            for (const movement in items[object].AccountMovement) {
              if(items[object].AccountMovement[movement].MovementType[0] === "Credit"){
                const payment = new CreateBankPaymentDto()
                const paymentRef = items[object].AccountMovement[movement].Reason[0]
                payment.amount  = Number(items[object].AccountMovement[movement].Amount[0]) * 100
                payment.currency  = items[object].AccountMovement[movement].CCY[0]
                payment.extCustomerId  = items[object].AccountMovement[movement].Account[0].BankClientID[0]
                payment.extPaymentIntentId  = items[object].AccountMovement[movement].DocumentReference[0]
                const [firstName,middleName,lastName] = items[object].AccountMovement[movement].OppositeSideName[0].split(' ')
                payment.personsFirstName = firstName
                payment.personsLastName = lastName
                accountMovements.push({payment , paymentRef})
              }
            }
          }
        })
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


      for await (const movement of accountMovements){
        const campaign = await this.campaignService.getCampaignByPaymentReference(movement.paymentRef)
        const vault = await this.vaultService.findByCampaignId(campaign.id)
        movement.payment.extPaymentMethodId = 'imported file bank payment'
        movement.payment.targetVaultId=vault[0].id
        movement.payment.personsEmail=person.email
        const donation = await this.donationsService.createBankPayment(movement.payment)
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
