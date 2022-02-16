import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Document } from '@prisma/client'

import { KeycloakTokenParsed } from '../auth/keycloak'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDocumentDto } from './dto/create-document.dto'
import { UpdateDocumentDto } from './dto/update-document.dto'

type DeleteManyResponse = {
  count: number
}

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async create(createDocumentDto: CreateDocumentDto, user: KeycloakTokenParsed) {
    return await this.prisma.document.create({ data: createDocumentDto.toEntity(user) })
  }

  async findAll(): Promise<Document[]> {
    return await this.prisma.document.findMany()
  }

  async findOne(id: string): Promise<Document> {
    try {
      return await this.prisma.document.findFirst({
        where: {
          id,
        },
        rejectOnNotFound: true,
      })
    } catch (err) {
      const msg = `No Document found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    try {
      return await this.prisma.document.update({
        where: {
          id,
        },
        data: {
          type: updateDocumentDto.type,
          name: updateDocumentDto.name,
          filename: updateDocumentDto.filename,
          filetype: updateDocumentDto.filetype,
          description: updateDocumentDto.description,
          sourceUrl: updateDocumentDto.sourceUrl,
        },
      })
    } catch (err) {
      const msg = `Update failed. No Document found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async remove(id: string): Promise<Document> {
    try {
      return await this.prisma.document.delete({
        where: {
          id,
        },
      })
    } catch (err) {
      const msg = `Delete failed. No Document found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }
  async removeMany(idsToDelete: string[]): Promise<DeleteManyResponse> {
    try {
      return await this.prisma.document.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      })
    } catch (err) {
      const msg = `Delete failed. No Document found with given ID`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }
}
