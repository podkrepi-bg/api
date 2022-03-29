import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { prismaMock } from '../prisma/prisma-client.mock'
import { BeneficiaryController } from './beneficiary.controller'
import { BeneficiaryService } from './beneficiary.service'
import { Beneficiary, BeneficiaryType, PersonRelation, Prisma, PrismaPromise } from '@prisma/client'

describe('BeneficiaryController', () => {
  let controller: BeneficiaryController
  let prismaService: PrismaService
  let expected: Beneficiary[]
  let expectedOne: Beneficiary

  beforeEach(() => {
    prismaService = prismaMock
    expected = [
      {
        id: 'random-id-2',
        type: expect.toBeOneOf(Object.values(BeneficiaryType)),
        personId: expect.any(String),
        coordinatorId: expect.any(String),
        coordinatorRelation: 'none',
        countryCode: 'BG',
        cityId: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        description: '',
        privateData: expect.any(Object),
        publicData: expect.any(Object),
        companyId: expect.anything(),
      },
      {
        id: expect.any(String),
        type: expect.toBeOneOf(Object.values(BeneficiaryType)),
        personId: expect.any(String),
        coordinatorId: expect.any(String),
        coordinatorRelation: 'none',
        countryCode: 'BG',
        cityId: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        description: '',
        privateData: expect.any(Object),
        publicData: expect.any(Object),
        companyId: expect.anything(),
      },
      {
        id: 'random-id',
        type: BeneficiaryType.individual,
        personId: 'random-id-person',
        coordinatorId: 'random-id-coord',
        coordinatorRelation: PersonRelation.none,
        countryCode: 'BG',
        cityId: 'random-id-city',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
        privateData: {},
        publicData: {},
        companyId: null,
      },
    ]
    expectedOne = {
      id: 'random-id',
      type: expect.toBeOneOf(Object.values(BeneficiaryType)),
      personId: expect.any(String),
      coordinatorId: expect.any(String),
      coordinatorRelation: 'none',
      countryCode: 'BG',
      cityId: expect.any(String),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      description: '',
      privateData: expect.any(Object),
      publicData: expect.any(Object),
      companyId: expect.anything(),
    }
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BeneficiaryController],
      providers: [
        BeneficiaryService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile()

    controller = module.get<BeneficiaryController>(BeneficiaryController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData', () => {
    it('should list all beneficiaries in db', async () => {
      const mockList = jest.fn<PrismaPromise<Beneficiary[]>, []>().mockResolvedValue(expected)

      const mockImplementation = jest
        .spyOn(prismaService.beneficiary, 'findMany')
        .mockImplementation(mockList)

      expect(await controller.list()).toEqual(expected)
      expect(await controller.list()).toHaveLength(3)
      expect(mockImplementation).toBeCalled()
    })
    it('should get one beneficiary', async () => {
      const mockItem = jest.fn<PrismaPromise<Beneficiary>, []>().mockResolvedValue(expectedOne)

      const mockImplementation = jest.spyOn(controller, 'getById').mockImplementation(mockItem)
      expect(await controller.getById('random-id')).toEqual(expectedOne)
      expect(mockImplementation).toBeCalled()
    })
  })

  describe('create and update data', () => {
    it('it should create beneficiary', async () => {
      const itemToPush = {
        id: 'random-id',
        type: BeneficiaryType.individual,
        personId: 'random-id-person',
        coordinatorId: 'random-id-coord',
        coordinatorRelation: PersonRelation.none,
        countryCode: 'BG',
        cityId: 'random-id-city',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
        privateData: {},
        publicData: {},
        companyId: null,
      }

      const mockItem = jest.fn<PrismaPromise<Beneficiary>, []>().mockImplementation(() => {
        expected.push(itemToPush)
        return itemToPush as unknown as PrismaPromise<Beneficiary>
      })

      const mockImplementation = jest.spyOn(controller, 'create').mockImplementation(mockItem)

      expect(await controller.create(itemToPush)).toEqual(itemToPush)
      expect(expected).toHaveLength(4)
      expect(mockImplementation).toBeCalled()
    })
    it('it should update beneficiary', async () => {
      const itemToUpdate = {
        id: 'random-id',
        type: BeneficiaryType.individual,
        personId: 'random-id-person',
        coordinatorId: 'random-id-coord',
        coordinatorRelation: PersonRelation.none,
        countryCode: 'BG',
        cityId: 'random-id-city',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
        privateData: {},
        publicData: {},
        companyId: null,
      }
      const index = expected.findIndex((x) => x.id == itemToUpdate.id)

      const mockItem = jest.fn<PrismaPromise<Beneficiary>, []>().mockImplementation(() => {
        expected[index] = itemToUpdate
        return itemToUpdate as unknown as PrismaPromise<Beneficiary>
      })

      const mockImplementation = jest.spyOn(controller, 'editById').mockImplementation(mockItem)

      expect(await controller.editById('random-id', itemToUpdate)).toEqual(itemToUpdate)
      expect(expected[index]).toEqual(itemToUpdate)
      expect(mockImplementation).toBeCalled()
    })
  })

  describe('removeData', () => {
    it('should remove one item', async () => {
      const itemToDelete = {
        id: 'random-id',
        type: BeneficiaryType.individual,
        personId: 'random-id-person',
        coordinatorId: 'random-id-coord',
        coordinatorRelation: PersonRelation.none,
        countryCode: 'BG',
        cityId: 'random-id-city',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
        privateData: {},
        publicData: {},
        companyId: null,
      }

      const mockFn = jest.fn<PrismaPromise<Beneficiary>, []>().mockImplementation(() => {
        expected.splice(expected.indexOf(itemToDelete), 1)
        return itemToDelete as unknown as PrismaPromise<Beneficiary>
      })

      const mockImplementation = jest.spyOn(controller, 'deleteById').mockImplementation(mockFn)

      expect(await controller.deleteById('random-id')).toEqual(itemToDelete)
      expect(expected).toHaveLength(2)
      expect(mockImplementation).toBeCalled()
    })
    it('should remove many items', async () => {
      const idsToDelete = ['random-id', 'random-id-2']
      const deletedItems: Beneficiary[] = []
      const mockFn = jest.fn<PrismaPromise<Prisma.BatchPayload>, []>().mockImplementation(() => {
        idsToDelete.map((id) => {
          const itemIndex = expected.findIndex((x) => x.id == id)
          deletedItems.push(expected[itemIndex])
          expected.splice(itemIndex, 1)
        })
        return deletedItems.length as unknown as PrismaPromise<Prisma.BatchPayload>
      })

      const mockImplementation = jest
        .spyOn(prismaMock.beneficiary, 'deleteMany')
        .mockImplementation(mockFn)

      expect(await prismaMock.beneficiary.deleteMany()).toEqual(2)
      expect(expected).toHaveLength(1)
      expect(mockImplementation).toBeCalled()
    })
  })
})
