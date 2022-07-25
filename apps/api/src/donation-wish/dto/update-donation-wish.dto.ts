import { PartialType } from '@nestjs/swagger'
import { CreateDonationWishDto } from './create-donation-wish.dto'

export class UpdateDonationWishDto extends PartialType(CreateDonationWishDto) {}
