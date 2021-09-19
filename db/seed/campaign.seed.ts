import { PrismaClient, CampaignState } from '@prisma/client'
const prisma = new PrismaClient()

export async function campaignSeed() {
  console.log('Campaigns seed')

  const persons = await prisma.person.findMany({ where: { newsletter: true } })
  console.log(persons)

  if (!persons) {
    throw new Error('No persons subscribed to newsletter')
  }

  const coordinatorFromDb = await prisma.coordinator.findFirst()
  console.log(coordinatorFromDb)

  if (!coordinatorFromDb) {
    throw new Error('No coordinator')
  }

  const beneficiaryFromDb = await prisma.beneficiary.findFirst()
  console.log(beneficiaryFromDb)

  if (!beneficiaryFromDb) {
    throw new Error('No beneficiary')
  }

  const campaignTypeFromDb = await prisma.campaignType.findFirst()
  console.log(campaignTypeFromDb)

  if (!campaignTypeFromDb) {
    throw new Error('No campaign type')
  }

  const descrText = "Остават последни няколко часа, през които към даренията до 50 долара (80лв) по проекта ни за изграждане на спални за сираци, Global Giving предоставя 50% бонус. Дечицата в момента продължават да спят на земята по около 20 в стаи под 10 кв.м., почти едно върху друго. Гледка и ситуация, която ние искаме, колкото се може по-скоро да променим. Това може да стане само благодарение на вашата помощ, колкото и малка или голяма да е тя. За събраните до момента близо 3000 ще получим почти 1500 долара бонус. Възможност, която след днес няма да е налична. Разбира се и след това може да подкрепите проекта ни, но без 50те % бонус. По всяко едно време (дори и след днес) и кътче на света може да направите дарение от следния линк"

  const descrText2 = "Остават последни няколко часа, през които към даренията до 50 долара (80лв) по проекта ни за изграждане на спални за сираци, Global Giving предоставя 50% бонус. Дечицата в момента продължават да спят на земята по около 20 в стаи под 10 кв.м., почти едно върху друго. Гледка и ситуация, която ние искаме, колкото се може по-скоро да променим. Това може да стане само благодарение на вашата помощ, колкото и малка или голяма да е тя. За събраните до момента близо 3000 ще получим почти 1500 долара бонус. Възможност, която след днес няма да е налична. Разбира се и след това може да подкрепите проекта ни, но без 50те % бонус. По всяко едно време (дори и след днес) и кътче на света може да направите дарение от следния линк. Остават последни няколко часа, през които към даренията до 50 долара (80лв) по проекта ни за изграждане на спални за сираци, Global Giving предоставя 50% бонус. Дечицата в момента продължават да спят на земята по около 20 в стаи под 10 кв.м., почти едно върху друго. Гледка и ситуация, която ние искаме, колкото се може по-скоро да променим. Това може да стане само благодарение на вашата помощ, колкото и малка или голяма да е тя. За събраните до момента близо 3000 ще получим почти 1500 долара бонус. Възможност, която след днес няма да е налична. Разбира се и след това може да подкрепите проекта ни, но без 50те % бонус. По всяко едно време (дори и след днес) и кътче на света може да направите дарение от следния линк. Остават последни няколко часа, през които към даренията до 50 долара (80лв) по проекта ни за изграждане на спални за сираци, Global Giving предоставя 50% бонус. Дечицата в момента продължават да спят на земята по около 20 в стаи под 10 кв.м., почти едно върху друго. Гледка и ситуация, която ние искаме, колкото се може по-скоро да променим. Това може да стане само благодарение на вашата помощ, колкото и малка или голяма да е тя. За събраните до момента близо 3000 ще получим почти 1500 долара бонус. Възможност, която след днес няма да е налична. Разбира се и след това може да подкрепите проекта ни, но без 50те % бонус. По всяко едно време (дори и след днес) и кътче на света може да направите дарение от следния линк"

  const insert = await prisma.campaign.createMany({
    data: [
      { state: CampaignState.active, slug: 'for-the-children', title: 'For the children', essence: "campaign brief", coordinatorId: coordinatorFromDb.id, beneficiaryId: beneficiaryFromDb.id, campaignTypeId: campaignTypeFromDb.id, description: descrText, targetAmount: 10000, currency: "BGN", },
      { state: CampaignState.active, slug: 'for-the-children1', title: 'For the children1', essence: "campaign brief", coordinatorId: coordinatorFromDb.id, beneficiaryId: beneficiaryFromDb.id, campaignTypeId: campaignTypeFromDb.id, description: descrText, targetAmount: 100000, currency: "BGN", },
      { state: CampaignState.active, slug: 'for-the-children2', title: 'For the children2', essence: "campaign brief", coordinatorId: coordinatorFromDb.id, beneficiaryId: beneficiaryFromDb.id, campaignTypeId: campaignTypeFromDb.id, description: descrText, targetAmount: 1000, currency: "BGN", },
      { state: CampaignState.active, slug: 'for-the-children3', title: 'For the children3', essence: "campaign brief", coordinatorId: coordinatorFromDb.id, beneficiaryId: beneficiaryFromDb.id, campaignTypeId: campaignTypeFromDb.id, description: descrText2, targetAmount: 900, currency: "BGN", },
      { state: CampaignState.active, slug: 'for-the-children4', title: 'For the children4', essence: "campaign brief", coordinatorId: coordinatorFromDb.id, beneficiaryId: beneficiaryFromDb.id, campaignTypeId: campaignTypeFromDb.id, description: descrText2, targetAmount: 2000000, currency: "BGN", },
      { state: CampaignState.active, slug: 'for-the-children5', title: 'For the children5', essence: "campaign brief", coordinatorId: coordinatorFromDb.id, beneficiaryId: beneficiaryFromDb.id, campaignTypeId: campaignTypeFromDb.id, description: descrText2, targetAmount: 123456, currency: "BGN", },
      ],
    skipDuplicates: true,
  })
  console.log({ insert })
}
