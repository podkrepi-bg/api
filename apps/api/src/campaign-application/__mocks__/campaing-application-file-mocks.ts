import { Readable } from 'stream'
import { CampaignApplicationFileRole } from '@prisma/client'
import { CreateCampaignApplicationFileDto } from '../dto/create-campaignApplication-file.dto'

export const mockCampaignApplicationFileFn = () => ({
  id: 'mockCampaignApplicationFileId',
  filename: 'test.pdf',
  mimetype: 'application/pdf',
  campaignApplicationId: 'mockCampaignApplicationId',
  personId: 'mockPersonId',
  role: CampaignApplicationFileRole.document,
})

export const mockCampaignApplicationUploadFileFn = () => ({
  bucketName: 'campaignapplication-files',
  ...mockCampaignApplicationFileFn(),
  campaignApplicationId: 'mockCampaignApplicationId',
  personId: 'mockPersonId',
})

export const mockCampaignApplicationFilesFn = (): Express.Multer.File[] => [
  {
    fieldname: 'resume',
    originalname: 'john_doe_resume.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 102400,
    stream: new Readable(),
    destination: '/uploads/resumes',
    filename: 'john_doe_resume_1234.pdf',
    path: '/uploads/resumes/john_doe_resume_1234.pdf',
    buffer: Buffer.from(''),
  },
  {
    fieldname: 'cover_letter',
    originalname: 'john_doe_cover_letter.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 51200,
    stream: new Readable(),
    destination: '/uploads/cover_letters',
    filename: 'john_doe_cover_letter_1234.pdf',
    path: '/uploads/cover_letters/john_doe_cover_letter_1234.pdf',
    buffer: Buffer.from(''),
  },
]

export const mockFileDtoFn = (): CreateCampaignApplicationFileDto => ({
  filename: 'Test Filename',
  mimetype: 'Test mimetype',
  campaignApplicationId: 'Test CampaignApplicationId',
  personId: 'Test PersonId',
  role: CampaignApplicationFileRole.document,
})
