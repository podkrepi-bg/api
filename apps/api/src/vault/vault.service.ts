import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common'
import { Prisma, Vault } from '@prisma/client'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateVaultDto } from './dto/create-vault.dto'
import { UpdateVaultDto } from './dto/update-vault.dto'

type VaultWithWithdrawalSum = Vault & { withdrawnAmount: number; campaignTitle: string }

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

  async findAll(): Promise<VaultWithWithdrawalSum[]> {
    const result = await this.prisma.$queryRaw<VaultWithWithdrawalSum[]>`
    SELECT 
    v.id, 
    v.campaign_id as "campaignId", 
    v.created_at as "createdAt", 
    v.updated_at as "updatedAt",
    v.currency, v."blockedAmount", 
    v.name,
    v.amount,
    c.title as "campaignTitle",
    COALESCE(SUM(w."successfullWithdrawn")::INTEGER, 0)  as "withdrawnAmount" 
    FROM vaults v
    LEFT JOIN LATERAL (
      SELECT SUM(amount)::INTEGER as "successfullWithdrawn" 
      FROM withdrawals 
      WHERE status::text = 'succeeded' AND source_vault_id::uuid = v.id::uuid
    )as w 
    ON TRUE

    LEFT JOIN LATERAL (
      SELECT  id, title FROM campaigns WHERE id::uuid = v.campaign_id::uuid
    ) as c ON TRUE

    GROUP BY v.id, c.title
    `
    return result
  }

  async findByCampaignId(campaignId: string): Promise<Vault[]> {
    return await this.prisma.vault.findMany({
      where: {
        campaignId,
      },
    })
  }
  async findOne(id: string): Promise<Vault> {
    try {
      return await this.prisma.vault.findFirstOrThrow({
        where: {
          id,
        },
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
    const vault = await this.prisma.vault.findFirstOrThrow({
      where: {
        id,
      },
    })
    if (vault.amount != 0 || vault.blockedAmount != 0) {
      throw new BadRequestException('Cannot delete non-empty vaults!')
    }

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
    const person = await this.personService.findOneByKeycloakId(keycloakId)
    if (!person) {
      Logger.warn(`No person record with keycloak ID: ${keycloakId}`)
      throw new UnauthorizedException()
    }

    const campaign = await this.campaignService.getCampaignByVaultIdAndPersonId(
      vaultId,
      person.id as string,
    )
    if (!campaign) {
      throw new UnauthorizedException()
    }
  }

  /**
   * Increment vault amount as part of donation in prisma transaction
   */
  public async incrementVaultAmount(
    vaultId: string,
    amount: number,
    tx: Prisma.TransactionClient,
  ): Promise<Vault> {
    const vault = await this.updateVaultAmount(vaultId, amount, tx, 'increment')

    await this.campaignService.updateCampaignStatusIfTargetReached(vault.campaignId, tx)

    return vault
  }

  /**
   * Decrement vault amount as part of donation in prisma transaction
   */
  public async decrementVaultAmount(
    vaultId: string,
    amount: number,
    tx: Prisma.TransactionClient,
  ): Promise<Vault> {
    return this.updateVaultAmount(vaultId, amount, tx, 'decrement')
  }

  async updateVaultAmount(
    vaultId: string,
    amount: number,
    tx: Prisma.TransactionClient,
    operationType: string,
  ) {
    if (amount <= 0) {
      throw new Error('Amount cannot be negative or zero.')
    }

    const updateStatement = {
      where: { id: vaultId },
      data: {
        amount: {
          [operationType]: amount,
        },
      },
    }

    const vault = await tx.vault.update(updateStatement)
    return vault
  }
}
