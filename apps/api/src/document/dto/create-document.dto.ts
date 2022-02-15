import { DocumentType, Prisma } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

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

    public toEntity(user): Prisma.DocumentCreateInput {
        return {
            type: this.type,
            name: this.name,
            filename: this.filename,
            filetype: this.filetype,
            description: this.description,
            sourceUrl: this.sourceUrl,
            owner: {
                connectOrCreate: {
                    where: {
                        email: user.email
                    },
                    create: {
                        firstName: user.given_name,
                        lastName: user.family_name,
                        email: user.email
                    }
                }
            }
        }
    }
}
