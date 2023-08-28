import { PrismaClient } from '@prisma/client'
import { Logger } from '@nestjs/common'

async function clearDbMarketingTemplates() {
  // Connect to DB
  const prisma = new PrismaClient()
  await prisma.$connect()

  // Clean the old templates
  await prisma.marketingTemplates.deleteMany()

  Logger.log(`All templates have been cleared from DB`)
}

clearDbMarketingTemplates().catch((e) => console.log(e))
