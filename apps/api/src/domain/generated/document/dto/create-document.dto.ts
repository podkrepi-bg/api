
import {DocumentType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentType})
type: DocumentType;
name: string;
filename: string;
filetype?: string;
description?: string;
sourceUrl: string;
}
