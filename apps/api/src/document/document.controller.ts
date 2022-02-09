import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) { }

  @Public()
  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentService.create(createDocumentDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.documentService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Public()
  @Put(':id')
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentService.update(id, updateDocumentDto);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentService.remove(id);
  }

  @Public()
  @Post('/delete-many')
  removeMany(@Body() idsToDelete: string[]) {
    return this.documentService.removeMany(idsToDelete);
  }
}
