export class CreateCampaignDto {
  slug: string
  title: string
  essence: string
  paymentReference: string
  description?: string
  targetAmount?: number
  startDate?: Date
  endDate?: Date
  deletedAt?: Date
}
