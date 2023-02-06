import { CampaignType, CampaignTypeCategory } from '@prisma/client'
import { campaignTypeFactory } from '../factory'

/**
 * List with pre-defined default Campaign Types
 * Treatment and rehabilitation
 */

export const campaignTypeTreatmentAndRehabilitation: CampaignType = campaignTypeFactory.build(
  {
    name: 'Treatment and rehabilitation',
    slug: 'treatment-and-rehabilitation',
    category: CampaignTypeCategory.medical,
  },
  { associations: { parentId: null } },
)

export const campaignTypeTransplantation = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Transplantation',
      slug: 'transplantation',
      category: CampaignTypeCategory.medical,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeCancer = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Cancer',
      slug: 'cancer',
      category: CampaignTypeCategory.medical,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeLeukemia = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Leukemia',
      slug: 'leukemia',
      category: CampaignTypeCategory.medical,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeGeneticDiseases = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Genetic diseases',
      slug: 'genetic-diseases',
      category: CampaignTypeCategory.medical,
    },
    { associations: { parentId } },
  )
}

export const campaignTypeRehabilitation = (parentId: string): CampaignType => {
  return campaignTypeFactory.build(
    {
      name: 'Rehabilitation',
      slug: 'rehabilitation',
      category: CampaignTypeCategory.medical,
    },
    { associations: { parentId } },
  )
}
