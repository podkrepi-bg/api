import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignModule } from '../campaign/campaign.module'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { VaultService } from './vault.service'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { mockVault } from './__mocks__/vault'
import { VaultUpdate } from './types/vault'
import { randomUUID } from 'crypto'
import { mockDonation, mockPayment } from '../donations/__mocks__/paymentMock'
import { Donation } from '@prisma/client'

describe('VaultService', () => {
  let service: VaultService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CampaignModule, NotificationModule, MarketingNotificationsModule],
      providers: [VaultService, MockPrismaService, CampaignService, PersonService, ConfigService],
    }).compile()

    service = module.get<VaultService>(VaultService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('decrementManyVaults should throw an error if one vaults returns negative amount', async () => {
    const vaultResponseMock = [
      mockVault,
      { ...mockVault, amount: 10, id: randomUUID() },
      { ...mockVault, amount: 20 },
    ]
    const listOfVaults: VaultUpdate = {
      [vaultResponseMock[0].id]: 90,
      [vaultResponseMock[1].id]: 20,
    }

    prismaMock.vault.findMany.mockResolvedValue(vaultResponseMock)
    const updateSpy = jest.spyOn(service, 'updateManyVaults').mockImplementation()
    expect(updateSpy).not.toHaveBeenCalled()
    await expect(service.decrementManyVaults(listOfVaults, prismaMock)).rejects
      .toThrow(`Updating vaults aborted, due to negative amount in some of the vaults.
        Invalid vaultIds: ${vaultResponseMock[1].id}`)
  })

  it('prepareVaultObjectFromDonation should return VaultUpdate object', () => {
    const [mockDonation, mockDonationToDiffVault, mockDonationToSameVault] = mockPayment.donations
    const vaultId1 = mockDonation.targetVaultId
    const vaultId2 = mockDonationToDiffVault.targetVaultId
    const result: VaultUpdate = {
      [vaultId1]: mockDonation.amount + mockDonationToSameVault.amount,
      [vaultId2]: mockDonationToDiffVault.amount,
    }
    expect(mockDonation.targetVaultId).toEqual(mockDonationToSameVault.targetVaultId)
    expect(service.prepareVaultUpdateObjectFromDonation(mockPayment.donations)).toEqual(result)
  })
  it('prepareSQLValuesString should return string of VALUES to be updated by SQL statement', () => {
    const [mockDonation, mockDonationToDiffVault, mockDonationToSameVault] = mockPayment.donations
    const vaultId1 = mockDonation.targetVaultId
    const vaultId2 = mockDonationToDiffVault.targetVaultId

    const vaultUpdateObj: VaultUpdate = {
      [vaultId1]: mockDonation.amount + mockDonationToSameVault.amount,
      [vaultId2]: mockDonationToDiffVault.amount,
    }

    const result = `('${vaultId1}'::uuid, ${vaultUpdateObj[vaultId1]}),('${vaultId2}'::uuid, ${vaultUpdateObj[vaultId2]})`

    expect(service.prepareSQLValuesString(vaultUpdateObj)).toEqual(result)
  })
})
