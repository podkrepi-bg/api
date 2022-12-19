import { CampaignType, CampaignTypeCategory } from '.prisma/client'
import { campaignTypeFactory } from '../factory'

/**
 * List with pre-defined default Campaign Types
 * Helping the needy
 */

export const campaignTypeHelpingTheNeedy: CampaignType = campaignTypeFactory.build(
  {
    name: 'Helping the needy',
    slug: 'helping-the-needy',
    category: CampaignTypeCategory.charity,
  },
  { associations: { parentId: null } },
)

export const campaignTypeKidsInRisk = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Kids in risk',
      slug: 'kids-in-risk',
      category: CampaignTypeCategory.charity,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeThirdAge = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Third age',
      slug: 'third-age',
      category: CampaignTypeCategory.charity,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeHomesForChildren = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Homes for children',
      slug: 'homes-for-children',
      category: CampaignTypeCategory.charity,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeNursingHomes = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Nursing homes',
      slug: 'nursing-homes',
      category: CampaignTypeCategory.medical,
    },
    { associations: { parentId } },
  )
}
