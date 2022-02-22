import { ApiProperty } from '@nestjs/swagger'
import { Currency, DonationStatus, DonationType, PaymentProvider, Person, Vault } from '@prisma/client'
import { Expose } from 'class-transformer'

@Expose()
export class CreatePaymentDto {
    @Expose()
    @ApiProperty({enum: DonationType})
    type: DonationType

    @Expose()
    @ApiProperty({enum: DonationStatus})
    status: DonationStatus

    @Expose()
    @ApiProperty({enum: PaymentProvider})
    provider: PaymentProvider

    @Expose()
    @ApiProperty({ enum: Currency})
    currency: Currency

    @ApiProperty()
    @Expose()
    
    amount: number

    @ApiProperty()
    @Expose()
    extCustomerId: string

    @ApiProperty()
    @Expose()
    extPaymentIntentId: string

    @ApiProperty()
    @Expose()
    extPaymentMethodId: string

    @ApiProperty()
    @Expose()
    targetVault: Vault

    @ApiProperty()
    @Expose()
    person: Person

}
