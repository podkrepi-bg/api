import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { BankaccountService } from './bankaccount.service'
import { CreateBankaccountDto } from './dto/create-bankaccount.dto'
import { UpdateBankaccountDto } from './dto/update-bankaccount.dto'

@Controller('bankaccount')
export class BankaccountController {
  constructor(private readonly bankaccountService: BankaccountService) {}

  @Post()
  @Public()
  create(@Body() createBankaccountDto: CreateBankaccountDto) {
    return this.bankaccountService.create(createBankaccountDto)
  }

  @Get()
  @Public()
  findAll() {
    return this.bankaccountService.findAll()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.bankaccountService.findOne(id)
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateBankaccountDto: UpdateBankaccountDto) {
    return this.bankaccountService.update(id, updateBankaccountDto)
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.bankaccountService.remove(id)
  }
}
