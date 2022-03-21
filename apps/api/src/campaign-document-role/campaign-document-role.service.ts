import { Injectable, NotFoundException } from '@nestjs/common'
import { CampaignDocumentRole } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCampaignDocumentRoleDto } from './dto/create-campaign-document-role.dto'
import { UpdateCampaignDocumentRoleDto } from './dto/update-campaign-document-role.dto'

@Injectable()
export class CampaignDocumentRoleService {
  constructor(private prisma: PrismaService) {}

  async create(
    createCampaignDocumentRoleDto: CreateCampaignDocumentRoleDto,
  ): Promise<CampaignDocumentRole> {
    return await this.prisma.campaignDocumentRole.create({ data: createCampaignDocumentRoleDto })
  }

  async findAll(): Promise<CampaignDocumentRole[]> {
    return await this.prisma.campaignDocumentRole.findMany()
  }

  async findOne(id: string): Promise<CampaignDocumentRole> {
    try {
      const find = await this.prisma.campaignDocumentRole.findFirst({
        where: { id: id },
        rejectOnNotFound: true,
      })
      return find
    } catch (error) {
      throw new NotFoundException(error.message)
    }
  }

  async update(
    id: string,
    updateCampaignDocumentRoleDto: UpdateCampaignDocumentRoleDto,
  ): Promise<CampaignDocumentRole> {
    try {
      const updatedTask = await this.prisma.campaignDocumentRole.update({
        where: {
          id: id,
        },
        data: { ...updateCampaignDocumentRoleDto },
      })
      return updatedTask
    } catch (error) {
      throw new NotFoundException(error.message)
    }
  }

  async remove(id: string): Promise<string | void> {
    try {
      const deletedDocument = await this.prisma.campaignDocumentRole.delete({ where: { id: id } })
      return `${deletedDocument.name} Deleted Succesfully!`
    } catch (error) {
      throw new NotFoundException(error.message)
    }
  }

  async removeMany(documentToDelete: [string]): Promise<string | void> {
    try {
      const ids = await this.prisma.campaignDocumentRole.findMany({
        where: { id: { in: documentToDelete } },
      })
      if (!ids.length) {
        throw new NotFoundException('Requested document`s ids does not exist!')
      }
      await this.prisma.campaignDocumentRole.deleteMany({
        where: {
          id: {
            in: documentToDelete,
          },
        },
      })
      return `Deleted Succesfully ${ids.length} from ${documentToDelete.length} tasks!`
    } catch (error) {
      throw new NotFoundException(error.message)
    }
  }
}
