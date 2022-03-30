import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common'

import { TransferService } from './transfer.service'

import { CreateTransferDto } from './dto/create-transfer.dto'
import { UpdateTransferDto } from './dto/update-transfer.dto'

@Controller('transfer')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post('create')
  create(@Body() createTransferDto: CreateTransferDto) {
    return this.transferService.create(createTransferDto)
  }

  @Get()
  findAll() {
    return this.transferService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transferService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTransferDto: UpdateTransferDto) {
    return this.transferService.update(id, updateTransferDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transferService.remove(id)
  }

  @Post('delete-many')
  removeMany(@Body() idsToDelete: string[]) {
    return this.transferService.removeMany(idsToDelete)
  }
}
