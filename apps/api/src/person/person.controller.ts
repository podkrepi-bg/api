import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { PersonService } from './person.service'

type Data = {
  firstName: string
  lastName: string
  email: string
  emailConfirmed?: boolean
  phone?: string
  company?: string
  newsletter?: boolean
  address?: string
  birthday?: Date
  personalNumber?: string
  keycloakId?: string
  stripeCustomerId?: string
}

@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @Public()
  async create(@Body() createPersonDto: Data) {
    console.log(createPersonDto)
    return this.personService.create(createPersonDto)
  }

  @Get()
  @Public()
  async findAll() {
    return this.personService.findAll()
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.personService.findOne(id)
  }

  @Put(':id')
  @Public()
  async update(@Param('id') id: string, @Body() updatePersonDto: Data) {
    return this.personService.update(id, updatePersonDto)
  }

  @Delete(':id')
  @Public()
  async remove(@Param('id') id: string) {
    return this.personService.remove(id)
  }

  @Post('deletemany')
  @Public()
  removeMany(@Body() itemsToDelete: [string]) {
    return this.personService.removeMany(itemsToDelete)
  }
}
