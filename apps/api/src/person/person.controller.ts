import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { PersonService } from './person.service'
import { CreatePersonDto } from './dto/create-person.dto'
import { UpdatePersonDto } from './dto/update-person.dto'
import { Public, AuthenticatedUser } from 'nest-keycloak-connect'
import { KeycloakTokenParsed } from '../auth/keycloak'

@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @Public()
  async create(@Body() createPersonDto: CreatePersonDto) {
    return await this.personService.create(createPersonDto)
  }

  @Get()
  @Public()
  async findAll() {
    return await this.personService.findAll()
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return await this.personService.findOne(id)
  }

  @Patch(':id')
  @Public()
  async update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
    return this.personService.update(id, updatePersonDto)
  }

  @Delete(':id')
  @Public()
  async remove(@Param('id') id: string) {
    return await this.personService.remove(id)
  }
}
