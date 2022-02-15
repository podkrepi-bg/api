import { Controller, Get, Post, Body, Param, Delete, Put, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUser, Public } from 'nest-keycloak-connect';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

import { KeycloakTokenParsed } from '../auth/keycloak'

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) { }

  @Post()
  create(@AuthenticatedUser()
  user: KeycloakTokenParsed, @Body() createDocumentDto: CreateDocumentDto) {

    if (!user) {
      throw new UnauthorizedException()
    }

    return this.documentService.create(createDocumentDto, user);
  }

  @Get()
  findAll(@AuthenticatedUser()
  user: KeycloakTokenParsed) {

    if (!user) {
      throw new UnauthorizedException()
    }

    return this.documentService.findAll();
  }

  @Get(':id')
  findOne(@AuthenticatedUser()
  user: KeycloakTokenParsed, @Param('id') id: string) {

    if (!user) {
      throw new UnauthorizedException()
    }

    return this.documentService.findOne(id);
  }

  @Put(':id')
  update(@AuthenticatedUser()
  user: KeycloakTokenParsed, @Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {

    if (!user) {
      throw new UnauthorizedException()
    }

    return this.documentService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  remove(@AuthenticatedUser()
  user: KeycloakTokenParsed, @Param('id') id: string) {

    if (!user) {
      throw new UnauthorizedException()
    }

    return this.documentService.remove(id);
  }

  @Post('/delete-many')
  removeMany(@AuthenticatedUser()
  user: KeycloakTokenParsed, @Body() idsToDelete: string[]) {

    if (!user) {
      throw new UnauthorizedException()
    }

    return this.documentService.removeMany(idsToDelete);
  }
}
