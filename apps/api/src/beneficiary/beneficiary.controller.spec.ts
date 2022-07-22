import { Test, TestingModule } from '@nestjs/testing'
import { BeneficiaryType, PersonRelation } from '@prisma/client'

import { MockPrismaService } from '../prisma/prisma-client.mock'
import { prismaMock } from '../prisma/prisma-client.mock'
import { mockReset } from 'jest-mock-extended'
import { NotFoundException } from '@nestjs/common'
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto'
import { BeneficiaryController } from './beneficiary.controller'
import { BeneficiaryService } from './beneficiary.service'

const mockData = [
  {
    id: '150d29a0-0414-4617-8a0b-9f88f6bd22bf',
    type: BeneficiaryType.individual,
    personId: '7531b754-985d-4112-81b8-36fc0c23031d',
    coordinatorId: 'da2980b0-86ea-41bd-a7f9-78c49da04e32',
    organizerId: 'da2980b0-86ea-41bd-a7f9-78c49da04e33',
    countryCode: 'BG',
    cityId: 'a7ba19e5-c23b-40d6-bcb0-cf2f4acfb0f5',
    updatedAt: null,
    createdAt: new Date('2022-03-30T09:51:17.431Z'),
    coordinatorRelation: PersonRelation.none,
    organizerRelation: PersonRelation.none,
    description: '',
    privateData: '',
    publicData: '',
    companyId: '',
  },
  {
    //company
    id: '159c3d7b-f752-43e9-870b-f05e5b7c313c',
    type: BeneficiaryType.company,
    personId: '',
    coordinatorId: 'da2980b0-86ea-41bd-a7f9-78c49da04e32',
    organizerId: 'da2980b0-86ea-41bd-a7f9-78c49da04e33',
    countryCode: 'BG',
    cityId: 'a7ba19e5-c23b-40d6-bcb0-cf2f4acfb0f5',
    createdAt: new Date('2022-03-30T09:51:17.431Z'),
    updatedAt: null,
    coordinatorRelation: PersonRelation.none,
    organizerRelation: PersonRelation.none,
    description: '',
    privateData: '',
    publicData: '',
    companyId: 'e08d9539-f830-456f-9510-a0f3ef6f93ec',
  },
  {
    id: '160e2ec4-d012-432b-b439-22402a074085',
    type: BeneficiaryType.individual,
    personId: '9ed767ca-34b1-408f-ab3f-eb34c8d9dae2',
    coordinatorId: 'da2980b0-86ea-41bd-a7f9-78c49da04e32',
    organizerId: 'da2980b0-86ea-41bd-a7f9-78c49da04e33',
    countryCode: 'BG',
    cityId: 'a7ba19e5-c23b-40d6-bcb0-cf2f4acfb0f5',
    createdAt: new Date('2022-03-30T09:51:17.431Z'),
    updatedAt: null,
    coordinatorRelation: PersonRelation.none,
    organizerRelation: PersonRelation.none,
    description: '',
    privateData: '',
    publicData: '',
    companyId: '',
  },
]

describe('BeneficiaryController', () => {
  let controller: BeneficiaryController

  beforeEach(async () => {
    prismaMock.beneficiary.findMany.mockResolvedValue(mockData)

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BeneficiaryController],
      providers: [BeneficiaryService, MockPrismaService],
    }).compile()

    controller = module.get<BeneficiaryController>(BeneficiaryController)
  })

  afterEach(() => {
    mockReset(prismaMock)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should list all beneficiaries in db', async () => {
    const result = await controller.list()
    expect(result).toHaveLength(3)
    expect(result).toEqual(mockData)
    expect(prismaMock.beneficiary.findMany).toHaveBeenCalled()
  })
  it('should get one beneficiary', async () => {
    const beneficiary = mockData[0]
    prismaMock.beneficiary.findFirst.mockResolvedValue(beneficiary)

    const result = await controller.getById(beneficiary.id)
    expect(result).toEqual(beneficiary)
    expect(prismaMock.beneficiary.findFirst).toHaveBeenCalledWith({
      where: { id: beneficiary.id },
      include: {
        person: true,
        city: { select: { name: true } },
        company: { select: { companyName: true } },
        coordinator: { select: { person: true } },
        organizer: { select: { person: true } },
      },
    })
  })

  it('should throw error if beneficiary does not exist', async () => {
    const beneficiary = mockData[0]

    await expect(controller.getById.bind(controller, beneficiary.id)).rejects.toThrow(
      new NotFoundException('Could not find beneficiary'),
    )
  })

  it('it should create beneficiary', async () => {
    const beneficiary = mockData[0]
    prismaMock.beneficiary.create.mockResolvedValue(beneficiary)

    const createDto: CreateBeneficiaryDto = {
      type: BeneficiaryType.individual,
      personId: beneficiary.personId,
      companyId: '',
      coordinatorId: beneficiary.coordinatorId,
      organizerId: beneficiary.organizerId,
      countryCode: beneficiary.countryCode,
      cityId: beneficiary.cityId,
      coordinatorRelation: beneficiary.coordinatorRelation,
      organizerRelation: beneficiary.organizerRelation,
      description: '',
      privateData: '',
      publicData: '',
    }

    const result = await controller.create(createDto)
    expect(result).toEqual(beneficiary)
    expect(prismaMock.beneficiary.create).toHaveBeenCalledWith({ data: createDto })
  })

  it('it should update beneficiary', async () => {
    const beneficiary = mockData[0]
    beneficiary.description = 'Updated Description'
    prismaMock.beneficiary.update.mockResolvedValue(beneficiary)

    const result = await controller.editById(beneficiary.id, beneficiary)
    expect(result).toEqual(beneficiary)
    expect(prismaMock.beneficiary.update).toHaveBeenCalledWith({
      where: { id: beneficiary.id },
      data: beneficiary,
    })
  })

  it('should remove one item', async () => {
    const beneficiary = mockData[0]
    prismaMock.beneficiary.delete.mockResolvedValue(beneficiary)

    const result = await controller.deleteById(beneficiary.id)
    expect(result).toEqual(beneficiary)
    expect(prismaMock.beneficiary.delete).toHaveBeenCalledWith({ where: { id: beneficiary.id } })
  })

  it('it should create beneficiary as company', async () => {
    const beneficiary = mockData[1]
    prismaMock.beneficiary.update.mockResolvedValue(beneficiary)

    const result = await controller.editById(beneficiary.id, beneficiary)
    expect(result).toEqual(beneficiary)
    expect(prismaMock.beneficiary.update).toHaveBeenCalledWith({
      where: { id: beneficiary.id },
      data: beneficiary,
    })
  })
})
