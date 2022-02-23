import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Vault } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateVaultDto } from './dto/create-vault.dto'
import { UpdateVaultDto } from './dto/update-vault.dto'

type DeleteManyResponse = {
  count: number
}

@Injectable()
export class VaultService {
  constructor(private prisma: PrismaService) { }

  async create(createVaultDto: CreateVaultDto) {
    return await this.prisma.vault.create({ data: createVaultDto.toEntity() })
  }

  async findAll(): Promise<Vault[]> {
    return await this.prisma.vault.findMany()
  }

  async findOne(id: string): Promise<Vault> {
    try {
      return await this.prisma.vault.findFirst({
        where: {
          id,
        },
        rejectOnNotFound: true,
      })
    } catch (err) {
      const msg = `No Vault found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async update(id: string, updateVaultDto: UpdateVaultDto): Promise<Vault> {
    try {
      return await this.prisma.vault.update({
        where: {
          id,
        },
        data: {
          name: updateVaultDto.name
        },
      })
    } catch (err) {
      const msg = `Update failed. No Vault found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async remove(id: string): Promise<Vault> {
    try {
      return await this.prisma.vault.delete({
        where: {
          id,
        },
      })
    } catch (err) {
      const msg = `Delete failed. No Vault found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }
  async removeMany(idsToDelete: string[]): Promise<DeleteManyResponse> {
    try {
      return await this.prisma.vault.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      })
    } catch (err) {
      const msg = `Delete failed. No Vault found with given ID`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }
}
