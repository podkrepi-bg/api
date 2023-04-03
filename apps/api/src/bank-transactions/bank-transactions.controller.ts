import { Response } from 'express'
import { Controller, Get, Query, Res } from '@nestjs/common'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { Roles, RoleMatchingMode, AuthenticatedUser } from 'nest-keycloak-connect'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { BankTransactionsService } from './bank-transactions.service'
import { BankTransactionsQueryDto } from './dto/bank-transactions-query-dto'

@ApiTags('bank-transaction')
@Controller('bank-transaction')
export class BankTransactionsController {
  constructor(private readonly bankTransactionsService: BankTransactionsService) {}

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
}
