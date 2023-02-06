import { CampaignType, CampaignTypeCategory } from '@prisma/client'
import { campaignTypeFactory } from '../factory'

/**
 * List with pre-defined default Campaign Types
 * Better society
 */

export const campaignTypeBetterSociety: CampaignType = campaignTypeFactory.build(
  {
    name: 'Better society',
    slug: 'better-society',
    category: CampaignTypeCategory.others,
  },
  { associations: { parentId: null } },
)

export const campaignTypeEducation = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Education',
      slug: 'education',
      category: CampaignTypeCategory.education,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeCulture = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Culture',
      slug: 'culture',
      category: CampaignTypeCategory.others,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeNature = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Nature',
      slug: 'nature',
      category: CampaignTypeCategory.nature,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeHumanRights = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Human rights',
      slug: 'human-rights',
      category: CampaignTypeCategory.others,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeAnimals = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Animals',
      slug: 'animals',
      category: CampaignTypeCategory.animals,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeDisasters = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Disasters',
      slug: 'disasters',
      category: CampaignTypeCategory.disasters,
    },
    { associations: { parentId } },
  )
}
