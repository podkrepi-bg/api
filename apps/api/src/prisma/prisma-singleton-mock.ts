import { PrismaService } from './prisma.service'
import { mockDeep, mockReset } from 'jest-mock-extended'
import { DeepMockProxy } from 'jest-mock-extended/lib/cjs/Mock'

import prisma from './prisma-client-mock'
import { Provider } from '@nestjs/common'

// Needed for mocking prisma to not make real requests to database
jest.mock('./prisma-client-mock', () => ({
  __esModule: true,
  default: mockDeep<PrismaService>(),
}))

beforeEach(() => {
  mockReset(prismaMock)
})

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaService>