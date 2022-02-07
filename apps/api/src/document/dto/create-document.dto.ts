
import { DocumentType, Prisma } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { CreatePersonDto } from '../../domain/generated/person/dto';

@Expose()
export class CreateDocumentDto {
    @Expose()
    @ApiProperty({ enum: DocumentType })
    type: DocumentType;

    @Expose()
    @ApiProperty()
    @IsString()
    name: string;

    @Expose()
    @ApiProperty()
    @IsString()
    filename: string;

    @Expose()
    @ApiProperty()
    @IsString()
    @IsOptional()
    filetype: string;

    @Expose()
    @ApiProperty()
    @IsString()
    @IsOptional()
    description: string;

    @Expose()
    @ApiProperty()
    @IsString()
    sourceUrl: string;


    public toEntity(): Prisma.DocumentCreateInput {
        return {
            type: this.type,
            name: this.name,
            filename: this.filename,
            filetype: this.filetype,
            description: this.description,
            sourceUrl: this.sourceUrl,
            owner: {
                //hardcoded for now
                connect: {
                    id: '15661b63-e72f-4c30-8d7d-a75e8d1b69f4'
                }
            },
        }
    }
}
