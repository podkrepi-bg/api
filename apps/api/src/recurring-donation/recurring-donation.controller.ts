import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UnauthorizedException,
} from '@nestjs/common'
import { RecurringDonationService } from './recurring-donation.service'
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto'
import { UpdateRecurringDonationDto } from './dto/update-recurring-donation.dto'
import { Public } from 'nest-keycloak-connect'

@Controller('recurring-donation')
export class RecurringDonationController {
  constructor(private readonly recurringDonationService: RecurringDonationService) {}

  @Post()
  @Public()
  create(@Body() createRecurringDonationDto: CreateRecurringDonationDto) {
    return this.recurringDonationService.create(createRecurringDonationDto)
  }

  @Get()
  @Public()
  findAll() {
    return this.recurringDonationService.findAll()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.recurringDonationService.findOne(id)
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateRecurringDonationDto: UpdateRecurringDonationDto) {
    return this.recurringDonationService.update(id, updateRecurringDonationDto)
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.recurringDonationService.remove(id)
  }
}
