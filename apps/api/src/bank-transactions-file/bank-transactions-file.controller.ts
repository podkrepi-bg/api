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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parseString = require('xml2js').parseString
    const xml = '<root>Hello xml2js!</root>'

    const accountMovements : {
      amount : number, currency : string, firstName : string,
      lastName : string, paymentRef: string, extCustomerId : string,
      extPaymentMethodId : string, extPaymentIntentId: string
      }[] = []
    const promises =  await Promise.all(

      files.map((file, key) => {
        parseString(file.buffer, function (err, items) {
          for (const object in items) {
            for (const movement in items[object].AccountMovement) {
              if(items[object].AccountMovement[movement].MovementType[0] === "Credit"){
                const AccountMovement : {
                  amount : number, currency : string, firstName : string,
                  lastName : string, paymentRef: string, extCustomerId : string,
                  extPaymentMethodId : string, extPaymentIntentId: string
                  } = {
                  amount : 0,
                  currency : '',
                  paymentRef:'',
                  extCustomerId:'',
                  extPaymentIntentId:'',
                  extPaymentMethodId : 'bank payment',
                  firstName : '',
                  lastName : '',
                }
                AccountMovement.amount  = Number(items[object].AccountMovement[movement].Amount[0]) * 100
                AccountMovement.currency  = items[object].AccountMovement[movement].CCY[0]
                AccountMovement.paymentRef  = items[object].AccountMovement[movement].Reason[0]
                AccountMovement.extCustomerId  = items[object].AccountMovement[movement].Account[0].BankClientID[0]
                AccountMovement.extPaymentIntentId  = items[object].AccountMovement[movement].DocumentReference[0]
                const [firstName,middleName,lastName] = items[object].AccountMovement[movement].OppositeSideName[0].split(' ')
                AccountMovement.firstName = firstName
                AccountMovement.lastName = lastName
                accountMovements.push(AccountMovement)
              }
            }
          }
        })


// reason -> paymentRef -> finding campaign -> get campaign -> get vaultById /firstOne/-> get ID
// the amount have to multiplied by 100 in order to be accurate
// extPaymentMethodId -> bank payment
// DocumentReference -> extPaymentIntentId
// BankClientID -> extCustomerId
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
      console.log(accountMovements);

      for await (const movement of accountMovements){
        const campaign = await this.campaignService.getCampaignByPaymentReference(movement.paymentRef)
        console.log(campaign);
        campaign.

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
