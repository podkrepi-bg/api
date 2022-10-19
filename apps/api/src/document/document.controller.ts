import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthenticatedUser, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

import { DocumentService } from './document.service'
import { CreateDocumentDto } from './dto/create-document.dto'
import { UpdateDocumentDto } from './dto/update-document.dto'

import { KeycloakTokenParsed } from '../auth/keycloak'
import { ApiTags } from '@nestjs/swagger';

@ApiTags('document')
@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  create(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.documentService.create(createDocumentDto, user)
  }

  @Get()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.documentService.findAll()
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findOne(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Param('id') id: string,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.documentService.findOne(id)
  }

  @Put(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.documentService.update(id, updateDocumentDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Param('id') id: string,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.documentService.remove(id)
  }
}
