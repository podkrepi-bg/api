import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { WithdrawalService } from './withdrawal.service'
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto'
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto'
import { Public } from 'nest-keycloak-connect'

@Controller('withdrawal')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post()
  create(@Body() createWithdrawalDto: CreateWithdrawalDto) {
    return this.withdrawalService.create(createWithdrawalDto)
  }

  @Get()
  @Public()
  findAll() {
    return this.withdrawalService.findAll()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.withdrawalService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWithdrawalDto: UpdateWithdrawalDto) {
    return this.withdrawalService.update(id, updateWithdrawalDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.withdrawalService.remove(id)
  }

  @Post('deletemany')
  removeMany(@Body() itemsToDelete: string[]) {
    return this.withdrawalService.removeMany(itemsToDelete)
  }
}
