import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignTypeCategory } from '@prisma/client'
import { mockReset } from 'jest-mock-extended'
import { prismaMock } from '../prisma/prisma-client.mock'

import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CampaignTypesController } from './campaign-types.controller'
import { CampaignTypesService } from './campaign-types.service'
import { CreateCampaignTypeDto } from './dto/create-campaign-type.dto'

const mockData = [
  {
    id: '0846e9cb-0668-448b-96de-1f35dfa9a1d4',
    name: 'Rehabilitation',
    slug: 'rehabilitation',
    description: '',
    parentId: 'ff7e63c8-ca12-4e34-8880-350a56eb1ba0',
    category: CampaignTypeCategory.medical,
  },
  {
    id: '32f16697-db01-4ae4-8269-b0d7616f9820',
    name: 'Better society',
    slug: 'better-society',
    description: '',
    parentId: '343b81b6-0c28-4664-939a-123eef437aa6',
    category: CampaignTypeCategory.others,
  },
  {
    id: '343b81b6-0c28-4664-939a-123eef437aa6',
    name: 'Disasters',
    slug: 'disasters',
    description: '',
    parentId: '32f16697-db01-4ae4-8269-b0d7616f9820',
    category: CampaignTypeCategory.disasters,
  },
]

describe('CampaignTypesController', () => {
  let controller: CampaignTypesController

  beforeEach(async () => {
    prismaMock.campaignType.findMany.mockResolvedValue(mockData)

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignTypesController],
      providers: [CampaignTypesService, MockPrismaService],
    }).compile()

    controller = module.get<CampaignTypesController>(CampaignTypesController)
  })

  afterEach(() => {
    mockReset(prismaMock)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should list all campaign types in db', async () => {
    const result = await controller.findAll()
    expect(result).toHaveLength(3)
    expect(result).toEqual(mockData)
    expect(prismaMock.campaignType.findMany).toHaveBeenCalled()
  })
  it('should get one campaign type', async () => {
    const campaignType = mockData[0]
    prismaMock.campaignType.findFirst.mockResolvedValue(campaignType)

    const result = await controller.findOne(campaignType.id)

    expect(result).toEqual(campaignType)
    expect(prismaMock.campaignType.findFirst).toHaveBeenCalledWith({
      where: { id: campaignType.id },
    })
  })

  it('should throw error if campaign type does not exist', async () => {
    const campaignType = mockData[0]

    await expect(controller.findOne.bind(controller, campaignType.id)).rejects.toThrow(
      new NotFoundException('No campaign type record with ID: ' + campaignType.id),
    )
  })
  it('it should create campaign type', async () => {
    const campaignType = mockData[0]
    prismaMock.campaignType.create.mockResolvedValue(campaignType)

    const createDto: CreateCampaignTypeDto = {
      name: campaignType.name,
      category: campaignType.category,
      slug: campaignType.slug,
    }

    const result = await controller.create(createDto)
    expect(result).toEqual(campaignType)
    expect(prismaMock.campaignType.create).toHaveBeenCalledWith({ data: createDto })
  })

  it('it should update campaign type', async () => {
    const campaignType = mockData[0]
    prismaMock.campaignType.update.mockResolvedValue(campaignType)

    const result = await controller.update(campaignType.id, campaignType)

    expect(result).toEqual(campaignType)
    expect(prismaMock.campaignType.update).toHaveBeenCalledWith({
      where: { id: campaignType.id },
      data: campaignType,
    })
  })

  it('should remove one item', async () => {
    const campaignType = mockData[0]
    prismaMock.campaignType.delete.mockResolvedValue(campaignType)

    const result = await controller.remove(campaignType.id)
    expect(result).toEqual(campaignType)
    expect(prismaMock.campaignType.delete).toHaveBeenCalledWith({
      where: { id: campaignType.id },
    })
  })
})
