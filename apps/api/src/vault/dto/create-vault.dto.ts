import { ApiProperty } from '@nestjs/swagger'
import {
  Currency,
  Prisma,
} from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateVaultDto {
  @Expose()
  @ApiProperty({ enum: Currency })
  currency: Currency

  @Expose()
  @IsString()
  @ApiProperty()
  name: string

  @Expose()
  @ApiProperty()
  @IsString()
  @IsUUID()
  campaignId: string

  public toEntity(): Prisma.VaultCreateInput {
    return {
      currency: this.currency,
      name: this.name,
      amount: 0,
      createdAt: new Date(),
      updatedAt: null,
      campaign: {
        connect: {
          id: this.campaignId,
        },
      },
    }
  }
}
