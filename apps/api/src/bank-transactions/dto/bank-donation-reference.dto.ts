import { IsNumber, IsString } from "class-validator";

export class CreateBankDonationReferenceDto {
    @IsNumber()
    amoount: number
    
    @IsString()
    campaignId: string

    @IsString()
    billingName: string

    @IsString()
    billingEmail: string
    
}