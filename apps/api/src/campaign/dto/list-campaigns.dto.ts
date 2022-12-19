import {
  BeneficiaryType,
  CampaignFileRole,
  CampaignState,
  CampaignTypeCategory,
  Prisma,
} from '@prisma/client'

export const AdminCampaignListItemSelect = Prisma.validator<Prisma.CampaignArgs>()({
  select: {
    id: true,
    state: true,
    slug: true,
    title: true,
    essence: true,
    paymentReference: true,
    targetAmount: true,
    allowDonationOnComplete: true,
    currency: true,
    startDate: true,
    endDate: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    campaignType: {
      select: {
        slug: true,
        name: true,
      },
    },
    beneficiary: {
      select: {
        id: true,
        type: true,
        publicData: true,
        person: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, companyName: true } },
      },
    },
    coordinator: {
      select: {
        person: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    },
    organizer: {
      select: {
        person: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  },
})

export type AdminCampaignListItem = Prisma.CampaignGetPayload<typeof AdminCampaignListItemSelect>

export const CampaignListItemSelect = Prisma.validator<Prisma.CampaignArgs>()({
  select: {
    id: true,
    state: true,
    slug: true,
    title: true,
    essence: true,
    paymentReference: true,
    targetAmount: true,
    allowDonationOnComplete: true,
    currency: true,
    startDate: true,
    endDate: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    campaignType: {
      select: {
        slug: true,
        name: true,
        category: true,
      },
    },
    beneficiary: {
      select: {
        id: true,
        type: true,
        publicData: true,
        person: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, companyName: true } },
      },
    },
    coordinator: {
      select: {
        id: true,
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    },
    organizer: {
      select: {
        id: true,
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    },
    campaignFiles: {
      where: { role: CampaignFileRole.campaignListPhoto },
      select: {
        id: true,
        filename: true,
        role: true,
      },
    },
    vaults: {
      select: {
        id: true,
      },
    },
  },
})

export type CampaignListItem = Prisma.CampaignGetPayload<typeof CampaignListItemSelect>
