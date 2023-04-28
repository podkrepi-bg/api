import { Response } from 'express'
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Query,
  Res,
} from '@nestjs/common'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { Roles, RoleMatchingMode, AuthenticatedUser } from 'nest-keycloak-connect'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { BankTransactionsService } from './bank-transactions.service'
import {
  BankTransactionsQueryDto,
  UpdateBankTransactionRefDto,
} from './dto/bank-transactions-query-dto'
import { CampaignService } from '../campaign/campaign.service'
import { BankDonationStatus } from '@prisma/client'

@ApiTags('bank-transaction')
@Controller('bank-transaction')
export class BankTransactionsController {
  constructor(
    private readonly bankTransactionsService: BankTransactionsService,
    private readonly campaignService: CampaignService,
  ) {}

  @Get('list')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'pageindex', required: false, type: Number })
  @ApiQuery({ name: 'pagesize', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: Date })
  @ApiQuery({ name: 'to', required: false, type: Date })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query() query?: BankTransactionsQueryDto) {
    return this.bankTransactionsService.listBankTransactions(
      query?.status,
      query?.type,
      query?.from,
      query?.to,
      query?.search,
      query?.pageindex,
      query?.pagesize,
    )
  }

  @Get('export-excel')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async exportToExcel(@Res() res: Response, @AuthenticatedUser() user: KeycloakTokenParsed) {
    if (isAdmin(user)) {
      await this.bankTransactionsService.exportToExcel(res)
    }
  }

  // Manually re-import unrecognized bank donation with the correct campaign payment code
  @Put('/:id/edit-ref')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async reImportFailedBankDonation(
    @Param('id') trxId: string,
    @Body() body: UpdateBankTransactionRefDto,
  ) {
    if (!body.paymentRef) throw new BadRequestException('Invalid Payment Code Format')

    const bankTransaction = await this.bankTransactionsService.getBankTrxById(trxId)

    if (!bankTransaction) throw new NotFoundException('Bank Transaction not found')

    if (
      bankTransaction.bankDonationStatus === BankDonationStatus.imported ||
      bankTransaction.bankDonationStatus === BankDonationStatus.reImported
    )
      throw new BadRequestException('Bank Transaction already imported')

    const campaign = await this.campaignService.getCampaignByPaymentReference(body.paymentRef)

    if (!campaign) throw new BadRequestException('No campaign matches this code')

    try {
      await this.bankTransactionsService.processDonation(
        bankTransaction,
        campaign.vaults[0],
        body.paymentRef,
      )
    } catch (e) {
      throw new BadRequestException('Failed Importing The Donation')
    }

    return {
      trxId: bankTransaction.id,
      paymentRef: campaign.paymentReference,
      status: BankDonationStatus.reImported,
    }
  }
}
