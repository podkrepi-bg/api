import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common'
import { Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

import { ExpensesService } from './expenses.service'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { UpdateExpenseDto } from './dto/update-expense.dto'

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Public()
  @Get('list')
  async findAll() {
    return await this.expensesService.listExpenses()
  }

  @Post('create-expense')
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.createExpense(createExpenseDto)
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(@Param('id') id: string, @Body() data: UpdateExpenseDto) {
    return this.expensesService.update(id, data)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id)
  }

  @Delete()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  removeMany(@Body() idsToDelete: string[]) {
    return this.expensesService.removeMany(idsToDelete)
  }
}
