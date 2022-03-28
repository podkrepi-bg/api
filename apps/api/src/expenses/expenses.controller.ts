import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthenticatedUser, Public } from 'nest-keycloak-connect'

import { KeycloakTokenParsed } from '../auth/keycloak'
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

  @Public()
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
  update(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Param('id')
    id: string,
    @Body() data: UpdateExpenseDto,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.expensesService.update(id, data)
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id)
  }

  @Public()
  @Delete()
  removeMany(@Body() idsToDelete: string[]) {
    return this.expensesService.removeMany(idsToDelete)
  }
}
