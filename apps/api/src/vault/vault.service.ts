import { forwardRef, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { Vault } from '@prisma/client'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateVaultDto } from './dto/create-vault.dto'
import { UpdateVaultDto } from './dto/update-vault.dto'
import { Person } from '.prisma/client'

@Injectable()
export class VaultService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => CampaignService)) private campaignService: CampaignService,
    @Inject(forwardRef(() => PersonService)) private personService: PersonService,
  ) {}

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
      const msg = `No Vault found with ID: ${id} Exception was: ${err.message}`

      Logger.warn(msg)
      throw err
    }
  }

  async update(id: string, updateVaultDto: UpdateVaultDto): Promise<Vault> {
    try {
      return await this.prisma.vault.update({
        where: {
          id,
        },
        data: {
          name: updateVaultDto.name,
        },
      })
    } catch (err) {
      const msg = `Error while updating Vault with id: ${id}! Exception was: ${err.message}`

      Logger.warn(msg)
      throw err
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
      const msg = `Error while deleting Vault with id: ${id}! Exception was: ${err.message}`
      Logger.warn(msg)

      throw err
    }
  }

  async checkVaultOwner(keycloakId: string, vaultId: string) {
    const person = (await this.personService.findOneByKeycloakId(keycloakId)) as Person
    const campaign = await this.campaignService.getCampaignByVaultIdAndPersonId(
      vaultId,
      person.id as string,
    )

    if (!campaign) {
      throw new UnauthorizedException()
    }
  }

  /**
   * Increment vault amount
   * TODO: Replace with joined view
   */
  public async incrementVaultAmount(vaultId: string, amount: number): Promise<Vault> {
    if (amount <= 0) {
      throw new Error('Amount cannot be negative or zero.')
    }

    const vault = await this.prisma.vault.update({
      data: {
        amount: {
          increment: amount,
        },
      },
      where: { id: vaultId },
    })

    await this.campaignService.updateCampaignStatusIfTargetReached(vault.campaignId)

    return vault
  }
}
