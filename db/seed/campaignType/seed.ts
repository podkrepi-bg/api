import { PrismaClient } from '@prisma/client'

import { CampaignType } from '@prisma/client'
import {
  campaignTypeCancer,
  campaignTypeGeneticDiseases,
  campaignTypeLeukemia,
  campaignTypeRehabilitation,
  campaignTypeTransplantation,
  campaignTypeTreatmentAndRehabilitation,
} from './data/treatment'
import {
  campaignTypeHelpingTheNeedy,
  campaignTypeHomesForChildren,
  campaignTypeKidsInRisk,
  campaignTypeNursingHomes,
  campaignTypeThirdAge,
} from './data/helping'
import {
  campaignTypeAnimals,
  campaignTypeBetterSociety,
  campaignTypeCulture,
  campaignTypeDisasters,
  campaignTypeEducation,
  campaignTypeHumanRights,
  campaignTypeNature,
} from './data/society'

const prisma = new PrismaClient()

export async function campaignTypesSeed() {
  console.log('CampaignTypes seed')

  await seedTreatmentAndRehabilitationCampaignTypes()
  await seedHelpingTheNeedyCampaignTypes()
  await seedBetterSocietyCampaignTypes()
}

async function seedTreatmentAndRehabilitationCampaignTypes() {
  const treatment = await prisma.campaignType.upsert({
    where: { slug: campaignTypeTreatmentAndRehabilitation.slug },
    create: campaignTypeTreatmentAndRehabilitation,
    update: {},
  })

  const defaultTreatmentCampaignTypes: CampaignType[] = [
    campaignTypeTransplantation(treatment.id),
    campaignTypeCancer(treatment.id),
    campaignTypeLeukemia(treatment.id),
    campaignTypeGeneticDiseases(treatment.id),
    campaignTypeRehabilitation(treatment.id),
  ]

  const insertTreatmentAndRehabilitationCampaignTypes = await prisma.campaignType.createMany({
    data: defaultTreatmentCampaignTypes,
    skipDuplicates: true,
  })

  console.log({ insertTreatmentAndRehabilitationCampaignTypes })
}

async function seedHelpingTheNeedyCampaignTypes() {
  const helping = await prisma.campaignType.upsert({
    where: { slug: campaignTypeHelpingTheNeedy.slug },
    create: campaignTypeHelpingTheNeedy,
    update: {},
  })

  const defaultHelpingCampaignTypes: CampaignType[] = [
    campaignTypeKidsInRisk(helping.id),
    campaignTypeThirdAge(helping.id),
    campaignTypeHomesForChildren(helping.id),
    campaignTypeNursingHomes(helping.id),
  ]

  const insertHelpingTheNeedyCampaignTypes = await prisma.campaignType.createMany({
    data: defaultHelpingCampaignTypes,
    skipDuplicates: true,
  })

  console.log({ insertHelpingTheNeedyCampaignTypes })
}

async function seedBetterSocietyCampaignTypes() {
  const society = await prisma.campaignType.upsert({
    where: { slug: campaignTypeBetterSociety.slug },
    create: campaignTypeBetterSociety,
    update: {},
  })

  const defaultSocietyCampaignTypes: CampaignType[] = [
    campaignTypeEducation(society.id),
    campaignTypeCulture(society.id),
    campaignTypeNature(society.id),
    campaignTypeHumanRights(society.id),
    campaignTypeAnimals(society.id),
    campaignTypeDisasters(society.id),
  ]

  const insertBetterSocietyCampaignTypes = await prisma.campaignType.createMany({
    data: defaultSocietyCampaignTypes,
    skipDuplicates: true,
  })

  console.log({ insertBetterSocietyCampaignTypes })
}
