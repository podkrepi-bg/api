import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { BankAccountService } from './bankaccount.service'
import { CreateBankaccountDto } from './dto/create-bankaccount.dto'
import { UpdateBankaccountDto } from './dto/update-bankaccount.dto'

@Controller('bankaccount')
export class BankAccountController {
  constructor(private readonly bankaccountService: BankAccountService) {}

  @Post()
  create(@Body() createBankaccountDto: CreateBankaccountDto) {
    return this.bankaccountService.create(createBankaccountDto)
  }

  @Get()
  findAll() {
    return this.bankaccountService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bankaccountService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBankaccountDto: UpdateBankaccountDto) {
    return this.bankaccountService.update(id, updateBankaccountDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bankaccountService.remove(id)
  }
}
