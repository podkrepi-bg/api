import { ApiProperty, PartialType } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';
import { CreateDocumentDto } from './create-document.dto';

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {

    @ApiProperty({ enum: DocumentType })
    type?: DocumentType;
    @ApiProperty()
    @IsString()
    name?: string;
    @ApiProperty()
    @IsString()
    filename?: string;
    @ApiProperty()
    @IsString()
    @IsOptional()
    filetype?: string;
    @ApiProperty()
    @IsString()
    @IsOptional()
    description?: string;
    @ApiProperty()
    @IsString()
    sourceUrl?: string;
}
