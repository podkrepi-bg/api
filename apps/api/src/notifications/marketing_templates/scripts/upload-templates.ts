import * as fs from 'fs'
import { PrismaClient } from '@prisma/client'
import * as sgClient from '@sendgrid/client'
import { Logger } from '@nestjs/common'
import { ClientRequest } from '@sendgrid/client/src/request'

sgClient.setApiKey(process.env['SENDGRID_API_KEY'] || '')

//One time script that can be run to upload the initial templates to sendgrid / else it should be done manually in the DB
async function createMarketingTemplatesIfNotExisting() {
  // Check if only a single template file is specified
  const singleFile = process.argv[2]

  // Get all files or single
  const fileNames = singleFile ? [singleFile] : fs.readdirSync('../templates')

  // Connect to DB
  const prisma = new PrismaClient()
  await prisma.$connect()

  Logger.log(`Uploading new templates`)

  for (const n of fileNames) {
    const content = fs.readFileSync('../templates/' + n, 'utf-8')

    const data = JSON.parse(content)

    const request = {
      url: `/v3/designs`,
      method: 'POST',
      body: data,
    } as ClientRequest

    const [response] = await sgClient.request(request)

    // Save reference in the DB
    if (response?.body['id']) {
      await prisma.marketingTemplates.create({
        data: { id: response?.body['id'], name: response?.body['name'] },
      })
    }

    Logger.log(`Template uploaded ----> ${response?.body['name']}`)
  }
}

createMarketingTemplatesIfNotExisting().catch((e) => console.log(e.response?.body))
