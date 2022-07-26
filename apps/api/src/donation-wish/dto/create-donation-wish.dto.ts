import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateDonationWishDto {
  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly message: string

  @Expose()
  @ApiProperty()
  @IsOptional()
  @IsUUID()
  public readonly donationId?: string

  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  public readonly campaignId: string

  @Expose()
  @ApiProperty()
  @IsOptional()
  @IsUUID()
  public readonly personId?: string
}
